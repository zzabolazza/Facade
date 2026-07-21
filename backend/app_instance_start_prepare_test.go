package backend

import (
	"slices"
	"testing"
)

func TestBuildBrowserLaunchArgsAddsAcceptLanguageFromLang(t *testing.T) {
	profile := &BrowserProfile{
		ProfileId:       "profile-1",
		FingerprintArgs: []string{"--lang=en-SG"},
	}

	args := buildBrowserLaunchArgs(profile, "/tmp/profile-1", 9222, "direct://", nil, nil, nil, nil)

	if !slices.Contains(args, "--accept-lang=en-SG,en") {
		t.Fatalf("expected derived accept language argument, got %v", args)
	}
}

func TestAppendDerivedAcceptLanguageArgPreservesExplicitValue(t *testing.T) {
	args := []string{"--lang=en-SG", "--accept-lang=fr-FR,fr"}

	got := appendDerivedAcceptLanguageArg(args)

	if !slices.Equal(got, args) {
		t.Fatalf("expected explicit accept language to be preserved, got %v", got)
	}
}

func TestAppendDerivedAcceptLanguageArgIgnoresMalformedLang(t *testing.T) {
	args := []string{"--lang=---"}

	got := appendDerivedAcceptLanguageArg(args)

	if !slices.Equal(got, args) {
		t.Fatalf("expected malformed language to be ignored, got %v", got)
	}
}
