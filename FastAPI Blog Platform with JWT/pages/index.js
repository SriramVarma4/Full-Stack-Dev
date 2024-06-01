import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

const App = () => {
        const [posts, setPosts] = useState([]);
        const [comments, setComments] = useState([]);
        const [newPost, setNewPost] = useState({
            title: '',
            content: '',
            author: '',
        });
        const [newComment, setNewComment] = useState({
            content: '',
            author: '',
            postId: '',
        });
        const [user, setUser] = useState(null);
        const [loginForm, setLoginForm] = useState({ email: '', password: '' });
        const [signupForm, setSignupForm] = useState({ email: '', password: '' });

        useEffect(() => {
            fetchPosts();
            fetchComments();
        }, []);

        const fetchPosts = async() => {
            try {
                const response = await axios.get(`${API_BASE_URL}/posts`);
                setPosts(response.data);
            } catch (error) {
                console.error('Error fetching posts:', error);
            }
        };

        const fetchComments = async() => {
            try {
                const response = await axios.get(`${API_BASE_URL}/comments`);
                setComments(response.data);
            } catch (error) {
                console.error('Error fetching comments:', error);
            }
        };

        const handleLoginFormChange = (e) => {
            const { name, value } = e.target;
            setLoginForm((prevState) => ({
                ...prevState,
                [name]: value,
            }));
        };

        const handleLoginFormSubmit = async(e) => {
            e.preventDefault();
            try {
                const response = await axios.post(`${API_BASE_URL}/login`, loginForm);
                const { access_token } = response.data;
                axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
                setUser(loginForm.email);
                setLoginForm({ email: '', password: '' });
            } catch (error) {
                console.error('Error logging in:', error);
            }
        };

        const handleSignupFormChange = (e) => {
            const { name, value } = e.target;
            setSignupForm((prevState) => ({
                ...prevState,
                [name]: value,
            }));
        };

        const handleSignupFormSubmit = async(e) => {
            e.preventDefault();
            try {
                await axios.post(`${API_BASE_URL}/register`, signupForm);
                setSignupForm({ email: '', password: '' });
            } catch (error) {
                console.error('Error signing up:', error);
            }
        };

        const handleLogout = () => {
            setUser(null);
            axios.defaults.headers.common['Authorization'] = '';
        };

        const handleNewPostChange = (e) => {
            const { name, value } = e.target;
            setNewPost((prevState) => ({
                ...prevState,
                [name]: value,
            }));
        };

        const handleNewPostSubmit = async(e) => {
            e.preventDefault();
            try {
                await axios.post(`${API_BASE_URL}/posts`, newPost);
                setNewPost({ title: '', content: '', author: '' });
                fetchPosts();
            } catch (error) {
                console.error('Error creating post:', error);
            }
        };

        const handleNewCommentChange = (e) => {
            const { name, value } = e.target;
            setNewComment((prevState) => ({
                ...prevState,
                [name]: value,
            }));
        };

        const handleNewCommentSubmit = async(e) => {
            e.preventDefault();
            try {
                await axios.post(`${API_BASE_URL}/comments`, newComment);
                setNewComment({ content: '', author: '', postId: '' });
                fetchComments();
            } catch (error) {
                console.error('Error creating comment:', error);
            }
        };

        if (!user) {
            return ( <
                div >
                <
                h1 > Login < /h1> <
                form onSubmit = { handleLoginFormSubmit } >
                <
                input type = "email"
                name = "email"
                placeholder = "Email"
                value = { loginForm.email }
                onChange = { handleLoginFormChange }
                /> <
                input type = "password"
                name = "password"
                placeholder = "Password"
                value = { loginForm.password }
                onChange = { handleLoginFormChange }
                /> <
                button type = "submit" > Login < /button> < /
                form >

                <
                h1 > Signup < /h1> <
                form onSubmit = { handleSignupFormSubmit } >
                <
                input type = "email"
                name = "email"
                placeholder = "Email"
                value = { signupForm.email }
                onChange = { handleSignupFormChange }
                /> <
                input type = "password"
                name = "password"
                placeholder = "Password"
                value = { signupForm.password }
                onChange = { handleSignupFormChange }
                /> <
                button type = "submit" > Signup < /button> < /
                form > <
                /div>
            );
        }

        return ( <
            div >
            <
            h1 > Welcome, { user }! < /h1> <
            button onClick = { handleLogout } > Logout < /button>

            <
            h2 > Create Post < /h2> <
            form onSubmit = { handleNewPostSubmit } >
            <
            input type = "text"
            name = "title"
            placeholder = "Title"
            value = { newPost.title }
            onChange = { handleNewPostChange }
            /> <
            textarea name = "content"
            placeholder = "Content"
            value = { newPost.content }
            onChange = { handleNewPostChange }
            /> <
            input type = "text"
            name = "author"
            placeholder = "Author"
            value = { newPost.author }
            onChange = { handleNewPostChange }
            /> <
            button type = "submit" > Create Post < /button> < /
            form >

            <
            h2 > Posts < /h2> {
            posts.map((post) => ( <
                    div key = { post.id } >
                    <
                    h3 > { post.title } < /h3> <
                    p > { post.content } < /p> <
                    p > Author: { post.author } < /p> <
                    h4 > Comments < /h4> {
                    comments
                    .filter((comment) => comment.postId === post.id)
                    .map((comment) => ( <
                        div key = { comment.id } >
                        <
                        p > { comment.content } < /p> <
                        p > Author: { comment.author } < /p> < /
                        div >
                    ))
                } <
                form onSubmit = { handleNewCommentSubmit } >
                <
                input type = "text"
                name = "content"
                placeholder = "Content"
                value = { newComment.content }
                onChange = { handleNewCommentChange }
                /> <
                input type = "text"
                name = "author"
                placeholder = "Author"
                value = { newComment.author }
                onChange = { handleNewCommentChange }
                /> <
                input type = "hidden"
                name = "postId"
                value = { post.id }
                /> <
                button type = "submit" > Add Comment < /button> < /
                form > <
                /div>
            ))
    } <
    /div>
);
};

export default App;