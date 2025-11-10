use anchor_lang::prelude::*;

#[constant]
pub const SEED: &str = "anchor";
pub const ANCHOR_DISCRIMINATOR: usize = 8; 

pub const MAX_TIMER_SECONDS: i64 = 24 * 60 * 60; // 24-hour cap
pub const TIMER_BONUS_SECONDS: i64 = 30;         // Adds 30 seconds per ticket purchase
pub const PRICE_INCREMENT: u64 = 100000;         // Price increases by 0.1U
pub const INIT_PRICE: u64 = 100000;              // Initial price 0.1U


pub const NONSTART_STATE: u8 = 0;
pub const RUNNING_STATE: u8 = 1;
pub const END_STATE: u8 = 2;
pub const ALL_END_STATE: u8 = 3;
