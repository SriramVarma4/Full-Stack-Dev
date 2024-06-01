from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy import create_engine, Column, ForeignKey, Integer, String
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from passlib.context import CryptContext
from jose import JWTError, jwt
from pydantic import BaseModel
from datetime import datetime, timedelta
import psycopg2
import databases
import secrets

# Configure SQLAlchemy
DATABASE_URL = "postgresql://postgres:pass@localhost:5432/users"
database = databases.Database(DATABASE_URL)

# Create tables in the database
Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)

    posts = relationship("Post", back_populates="author")


class Post(Base):
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    content = Column(String)
    author_id = Column(Integer, ForeignKey("users.id"))

    author = relationship("User", back_populates="posts")
    comments = relationship("Comment", back_populates="post")


class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    content = Column(String)
    author_id = Column(Integer, ForeignKey("users.id"))
    post_id = Column(Integer, ForeignKey("posts.id"))

    author = relationship("User")
    post = relationship("Post", back_populates="comments")

# Create FastAPI app
app = FastAPI()

# Create database dependency
async def get_db():
    async with database:
        yield database

# Hashing and verification of passwords
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

# Define SECRET_KEY and ALGORITHM
SECRET_KEY = secrets.token_hex(32)
ALGORITHM = "HS256"

# JWT token functions
def create_access_token(data: dict, expires_delta: timedelta):
    to_encode = data.copy()
    expire = datetime.utcnow() + expires_delta
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(token: str = Depends(OAuth2PasswordBearer(tokenUrl="login"))):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication credentials")
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    return user_id

# API routes
@app.get("/")
async def root():
    endpoints = [
        {"url": "/", "description": "Root endpoint"},
        {"url": "/register", "description": "Register a new user"},
        {"url": "/login", "description": "User login"},
    ]
    return {"endpoints": endpoints}
@app.post("/register")
async def register(email: str, password: str, db: databases.Database = Depends(get_db)):
    query = User.select().where(User.email == email)
    user = await db.fetch_one(query)
    if user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    hashed_password = get_password_hash(password)
    query = User.insert().values(email=email, password_hash=hashed_password)
    await db.execute(query)
    return {"message": "User created successfully"}

@app.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: databases.Database = Depends(get_db)):
    query = User.select().where(User.email == form_data.username)
    user = await db.fetch_one(query)
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid username or password")
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token({"sub": user.email}, expires_delta=access_token_expires)
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/posts")
async def create_post(title: str, content: str, current_user: str = Depends(get_current_user), db: databases.Database = Depends(get_db)):
    query = User.select().where(User.email == current_user)
    user = await db.fetch_one(query)
    query = Post.insert().values(title=title, content=content, author_id=user.id)
    post_id = await db.execute(query)
    post = await db.fetch_one(Post.select().where(Post.id == post_id))
    return post

@app.get("/posts")
async def get_all_posts(db: databases.Database = Depends(get_db)):
    query = Post.select()
    posts = await db.fetch_all(query)
    return posts

@app.get("/posts/{post_id}")
async def get_post(post_id: int, db: databases.Database = Depends(get_db)):
    query = Post.select().where(Post.id == post_id)
    post = await db.fetch_one(query)
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    return post

@app.put("/posts/{post_id}")
async def update_post(post_id: int, title: str, content: str, current_user: str = Depends(get_current_user), db: databases.Database = Depends(get_db)):
    query = Post.select().where(Post.id == post_id)
    post = await db.fetch_one(query)
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    if post.author.email != current_user:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not the author of this post")
    query = (
        Post.update()
        .where(Post.id == post_id)
        .values(title=title, content=content)
    )
    await db.execute(query)
    post = await db.fetch_one(query)
    return post

@app.delete("/posts/{post_id}")
async def delete_post(post_id: int, current_user: str = Depends(get_current_user), db: databases.Database = Depends(get_db)):
    query = Post.select().where(Post.id == post_id)
    post = await db.fetch_one(query)
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    if post.author.email != current_user:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not the author of this post")
    query = Post.delete().where(Post.id == post_id)
    await db.execute(query)
    return {"message": "Post deleted successfully"}

@app.post("/comments")
async def create_comment(post_id: int, content: str, current_user: str = Depends(get_current_user), db: databases.Database = Depends(get_db)):
    query = User.select().where(User.email == current_user)
    user = await db.fetch_one(query)
    query = Post.select().where(Post.id == post_id)
    post = await db.fetch_one(query)
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    query = Comment.insert().values(content=content, author_id=user.id, post_id=post.id)
    comment_id = await db.execute(query)
    comment = await db.fetch_one(Comment.select().where(Comment.id == comment_id))
    return comment

@app.get("/comments")
async def get_all_comments(db: databases.Database = Depends(get_db)):
    query = Comment.select()
    comments = await db.fetch_all(query)
    return comments

@app.get("/comments/{comment_id}")
async def get_comment(comment_id: int, db: databases.Database = Depends(get_db)):
    query = Comment.select().where(Comment.id == comment_id)
    comment = await db.fetch_one(query)
    if not comment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")
    return comment

@app.put("/comments/{comment_id}")
async def update_comment(comment_id: int, content: str, current_user: str = Depends(get_current_user), db: databases.Database = Depends(get_db)):
    query = Comment.select().where(Comment.id == comment_id)
    comment = await db.fetch_one(query)
    if not comment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")
    if comment.author.email != current_user:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not the author of this comment")
    query = (
        Comment.update()
        .where(Comment.id == comment_id)
        .values(content=content)
    )
    await db.execute(query)
    comment = await db.fetch_one(query)
    return comment

@app.delete("/comments/{comment_id}")
async def delete_comment(comment_id: int, current_user: str = Depends(get_current_user), db: databases.Database = Depends(get_db)):
    query = Comment.select().where(Comment.id == comment_id)
    comment = await db.fetch_one(query)
    if not comment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")
    if comment.author.email != current_user:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not the author of this comment")
    query = Comment.delete().where(Comment.id == comment_id)
    await db.execute(query)
    return {"message": "Comment deleted successfully"}
