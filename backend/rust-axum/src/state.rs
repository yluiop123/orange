use std::sync::Arc;

use crate::config::Config;
use crate::db::Db;

#[derive(Clone)]
pub struct AppState {
    pub db: Db,
    pub config: Arc<Config>,
}

impl AppState {
    pub fn new(db: Db, config: Config) -> Self {
        Self {
            db,
            config: Arc::new(config),
        }
    }
}
