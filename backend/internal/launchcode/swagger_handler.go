package launchcode

import (
	"embed"
	"io/fs"
	"net/http"
	"strings"
)

//go:embed swagger/*
var swaggerFS embed.FS

func (s *LaunchServer) registerSwaggerRoutes(mux *http.ServeMux) {
	sub, err := fs.Sub(swaggerFS, "swagger")
	if err != nil {
		mux.HandleFunc("/swagger", func(w http.ResponseWriter, r *http.Request) {
			http.Error(w, "swagger assets unavailable", http.StatusInternalServerError)
		})
		return
	}

	fileServer := http.FileServer(http.FS(sub))

	mux.HandleFunc("/swagger", func(w http.ResponseWriter, r *http.Request) {
		http.Redirect(w, r, "/swagger/", http.StatusFound)
	})

	mux.Handle("/swagger/", http.StripPrefix("/swagger/", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		path := strings.Trim(r.URL.Path, "/")
		if path == "" {
			data, readErr := fs.ReadFile(sub, "index.html")
			if readErr != nil {
				http.Error(w, "swagger index unavailable", http.StatusInternalServerError)
				return
			}
			w.Header().Set("Content-Type", "text/html; charset=utf-8")
			_, _ = w.Write(data)
			return
		}
		fileServer.ServeHTTP(w, r)
	})))
}
