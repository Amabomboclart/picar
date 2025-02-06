package main

import (
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"
)

const (
	HOME   = "."
	PUBLIC = HOME + ""
)

type Server struct{}

func (server *Server) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	path := r.URL.Path
	fmt.Printf("%s", path)
	if strings.HasPrefix(path, "/traffic_light") {
		path = path[14:]
		fmt.Printf("%s\n", path)
	}

	if path == "" || path == "/" {
		path = "/index.html"
	}

	w.Header().Set("Cross-Origin-Opener-Policy", "same-origin")
	w.Header().Set("Cross-Origin-Embedder-Policy", "require-corp")

	file := PUBLIC + path
	if _, err := os.Stat(file); err == nil {
		http.ServeFile(w, r, file)
	} else {
		w.WriteHeader(404)
	}
}

func main() {
	server := &Server{}
	http_server := &http.Server{
		Handler:        server,
		ReadTimeout:    10 * time.Second,
		WriteTimeout:   10 * time.Second,
		MaxHeaderBytes: 1048576,
		Addr:           ":80",
	}
	fmt.Fprintf(os.Stdout, "Server running at %v\n", http_server.Addr)
	err := http_server.ListenAndServe()
	if err != nil {
		fmt.Fprintf(os.Stdout, "An error has occurred: %v", err)
		os.Exit(1)
	}
}
