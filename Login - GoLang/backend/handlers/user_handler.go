package handlers

import (
	"encoding/json"
	"net/http"
	"strings"

	"fmt"
	"github.com/jinzhu/gorm"
	"golang.org/x/crypto/bcrypt"
	"my_project/backend/models"
)

type UserHandler struct {
	db *gorm.DB
}

func NewUserHandler(db *gorm.DB) *UserHandler {
	return &UserHandler{db: db}
}

func (uh *UserHandler) Register(w http.ResponseWriter, r *http.Request) {
	var user models.User
	err := json.NewDecoder(r.Body).Decode(&user)
	if err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	err = uh.db.Create(&user).Error
	if err != nil {
		if gorm.IsRecordNotFoundError(err) {
			http.Error(w, "User not found", http.StatusNotFound)
		} else if strings.Contains(err.Error(), "duplicate key value violates unique constraint") {
			http.Error(w, "Username already exists", http.StatusBadRequest)
		} else {
			http.Error(w, "Failed to register user", http.StatusInternalServerError)
		}
		return
	}

	// Log the inserted user
	fmt.Printf("User inserted: %+v\n", user)

	w.WriteHeader(http.StatusOK)
	w.Write([]byte("User registered successfully"))
}

func (uh *UserHandler) Login(w http.ResponseWriter, r *http.Request) {
	var user models.User
	err := json.NewDecoder(r.Body).Decode(&user)
	if err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	err = uh.db.Where("username = ?", user.Username).First(&user).Error
	if err != nil {
		http.Error(w, "Invalid username or password", http.StatusUnauthorized)
		return
	}

	// Compare the provided password with the stored password
	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(user.Password))
	if err != nil {
		http.Error(w, "Invalid username or password", http.StatusUnauthorized)
		return
	}

	// Additional authentication checks

	w.WriteHeader(http.StatusOK)
	w.Write([]byte("User logged in successfully"))
}
