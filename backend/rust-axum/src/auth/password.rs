use rand::Rng;

use crate::error::AppError;

/// 12 characters, excluding look-alike characters (0/O, 1/l/I).
const TEMP_PASSWORD_CHARS: &[u8] =
    b"ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

const BCRYPT_COST: u32 = 10;

pub fn generate_temp_password() -> String {
    let mut rng = rand::thread_rng();
    let mut password = String::with_capacity(12);
    for _ in 0..12 {
        let index = rng.gen_range(0..TEMP_PASSWORD_CHARS.len());
        password.push(TEMP_PASSWORD_CHARS[index] as char);
    }
    password
}

/// Seed hashes are stored with Spring's `{bcrypt}` id prefix; the plain BCrypt
/// library expects the raw `$2a$...` hash.
fn normalize_hash(hash: &str) -> &str {
    hash.strip_prefix("{bcrypt}").unwrap_or(hash)
}

pub async fn verify(plain: String, hash: String) -> bool {
    tokio::task::spawn_blocking(move || {
        bcrypt::verify(plain, normalize_hash(&hash)).unwrap_or(false)
    })
    .await
    .unwrap_or(false)
}

pub async fn hash(plain: String) -> Result<String, AppError> {
    let result = tokio::task::spawn_blocking(move || bcrypt::hash(plain, BCRYPT_COST))
        .await
        .map_err(|error| {
            tracing::error!(error = %error, "password hashing task failed");
            AppError::system()
        })?;
    result.map_err(|error| {
        tracing::error!(error = %error, "password hashing failed");
        AppError::system()
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn temporary_password_is_twelve_chars() {
        let password = generate_temp_password();
        assert_eq!(password.chars().count(), 12);
        assert!(password
            .chars()
            .all(|ch| TEMP_PASSWORD_CHARS.contains(&(ch as u8))));
    }

    #[test]
    fn temporary_passwords_differ() {
        assert_ne!(generate_temp_password(), generate_temp_password());
    }

    #[test]
    fn spring_bcrypt_prefix_is_stripped() {
        assert_eq!(normalize_hash("{bcrypt}$2a$10$abc"), "$2a$10$abc");
        assert_eq!(normalize_hash("$2a$10$abc"), "$2a$10$abc");
    }
}
