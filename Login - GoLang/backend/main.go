package main

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/gorilla/mux"
	"github.com/rs/cors"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

type User struct {
	gorm.Model
	Username string
	Password string
}

var db *gorm.DB

func main() {
	// Connect to the PostgreSQL database
	dsn := "host=localhost user=postgres password=pass dbname=users port=5432 sslmode=disable"
	var err error
	db, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal(err)
	}

	// Auto-migrate the User model
	err = db.AutoMigrate(&User{})
	if err != nil {
		log.Fatal(err)
	}

	r := mux.NewRouter()

	// Enable CORS using the rs/cors package
	c := cors.Default()

	// Login API endpoint
	r.HandleFunc("/api/login", authenticate(loginHandler)).Methods("POST")

	// Signup API endpoint
	r.HandleFunc("/api/signup", signupHandler).Methods("POST")

	// Dashboard API endpoint
	r.HandleFunc("/api/dashboard", authenticate(dashboardHandler)).Methods("GET")

	// Apply CORS middleware to the router
	handler := c.Handler(r)

	log.Println("Server is running on port 8000...")
	log.Fatal(http.ListenAndServe(":8000", handler))
}

func authenticate(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {

		authenticated := true

		if !authenticated {
			w.WriteHeader(http.StatusUnauthorized)
			return
		}

		// Proceed to the next handler
		next.ServeHTTP(w, r)
	}
}

func loginHandler(w http.ResponseWriter, r *http.Request) {
	var user User
	err := json.NewDecoder(r.Body).Decode(&user)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	// Check if the user exists in the database
	var existingUser User
	result := db.Where("username = ?", user.Username).First(&existingUser)
	if result.Error != nil {
		log.Println("User not found:", user.Username)
		w.WriteHeader(http.StatusUnauthorized)
		return
	}

	// Check if the password is correct
	if user.Password != existingUser.Password {
		log.Println("Invalid password for user:", user.Username)
		w.WriteHeader(http.StatusUnauthorized)
		return
	}

	// Authentication successful
	log.Println("User logged in:", user.Username)
	w.WriteHeader(http.StatusOK)
}

func signupHandler(w http.ResponseWriter, r *http.Request) {
	var user User
	err := json.NewDecoder(r.Body).Decode(&user)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	// Check if the username already exists in the database
	var existingUser User
	result := db.Where("username = ?", user.Username).First(&existingUser)
	if result.Error == nil {
		log.Println("Username already exists:", user.Username)
		w.WriteHeader(http.StatusConflict)
		return
	}

	// Create a new user in the database
	result = db.Create(&user)
	if result.Error != nil {
		log.Println("Failed to create user:", user.Username)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	log.Println("User registered:", user.Username)
	w.WriteHeader(http.StatusOK)
}

func dashboardHandler(w http.ResponseWriter, r *http.Request) {
	// Fetch user data from the database
	var users []User
	result := db.Find(&users)
	if result.Error != nil {
		log.Println("Failed to fetch user data:", result.Error)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	log.Println("Fetched user data:", users)
	// Return user data as JSON
	json.NewEncoder(w).Encode(users)
}
