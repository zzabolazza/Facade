package launchcode

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestSwaggerRoutesServeUIAndSpec(t *testing.T) {
	srv := NewLaunchServer(nil, nil, nil, 0)
	handler := NewTestHandler(srv)

	redirect := httptest.NewRecorder()
	handler.ServeHTTP(redirect, httptest.NewRequest(http.MethodGet, "/swagger", nil))
	if redirect.Code != http.StatusFound {
		t.Fatalf("GET /swagger status = %d, want %d", redirect.Code, http.StatusFound)
	}
	if loc := redirect.Header().Get("Location"); loc != "/swagger/" {
		t.Fatalf("GET /swagger Location = %q, want /swagger/", loc)
	}

	index := httptest.NewRecorder()
	handler.ServeHTTP(index, httptest.NewRequest(http.MethodGet, "/swagger/", nil))
	if index.Code != http.StatusOK {
		t.Fatalf("GET /swagger/ status = %d, want %d", index.Code, http.StatusOK)
	}
	body := index.Body.String()
	if !strings.Contains(body, "swagger-ui") {
		t.Fatalf("GET /swagger/ body missing swagger-ui marker")
	}

	spec := httptest.NewRecorder()
	handler.ServeHTTP(spec, httptest.NewRequest(http.MethodGet, "/swagger/openapi.yaml", nil))
	if spec.Code != http.StatusOK {
		t.Fatalf("GET /swagger/openapi.yaml status = %d, want %d", spec.Code, http.StatusOK)
	}
	if !strings.Contains(spec.Body.String(), "openapi:") {
		t.Fatalf("openapi.yaml missing openapi marker")
	}

	bundle := httptest.NewRecorder()
	handler.ServeHTTP(bundle, httptest.NewRequest(http.MethodGet, "/swagger/swagger-ui-bundle.js", nil))
	if bundle.Code != http.StatusOK {
		t.Fatalf("GET /swagger/swagger-ui-bundle.js status = %d, want %d", bundle.Code, http.StatusOK)
	}
}
