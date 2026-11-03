package auth

import (
	"crypto/rand"
	"math/big"
	"strings"

	"golang.org/x/crypto/bcrypt"
)

// The PostgreSQL seed stores Spring DelegatingPasswordEncoder hashes prefixed
// with {bcrypt}. New hashes use the same format so the Java reference can read
// rows created by this service.
const bcryptPrefix = "{bcrypt}"

// Temporary password alphabet excludes visually ambiguous characters
// (I, l, O, 0, 1) like the reference implementation.
const temporaryPasswordAlphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789"

const TemporaryPasswordLength = 12

func HashPassword(password string) (string, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}
	return bcryptPrefix + string(hash), nil
}

func CheckPassword(hash, password string) bool {
	hash = strings.TrimPrefix(hash, bcryptPrefix)
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(password)) == nil
}

func GenerateTemporaryPassword() (string, error) {
	result := make([]byte, TemporaryPasswordLength)
	max := big.NewInt(int64(len(temporaryPasswordAlphabet)))
	for i := range result {
		index, err := rand.Int(rand.Reader, max)
		if err != nil {
			return "", err
		}
		result[i] = temporaryPasswordAlphabet[index.Int64()]
	}
	return string(result), nil
}
