package service

import "strings"

// localizedPermissionName resolves the display name for a locale. Lookup order
// is: case-insensitive exact locale, the language part before "-", then the
// permission's default name.
func localizedPermissionName(locale string, translations map[string]string, fallback string) string {
	if len(translations) == 0 {
		return fallback
	}
	normalized := strings.ToLower(strings.TrimSpace(locale))
	if normalized == "" {
		return fallback
	}

	byLocale := make(map[string]string, len(translations))
	for key, name := range translations {
		normalizedKey := strings.ToLower(strings.TrimSpace(key))
		if normalizedKey == "" || strings.TrimSpace(name) == "" {
			continue
		}
		byLocale[normalizedKey] = name
	}

	if name, ok := byLocale[normalized]; ok {
		return name
	}
	if index := strings.IndexByte(normalized, '-'); index > 0 {
		if name, ok := byLocale[normalized[:index]]; ok {
			return name
		}
	}
	return fallback
}
