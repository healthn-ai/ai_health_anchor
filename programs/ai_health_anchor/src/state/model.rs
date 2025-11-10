use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct GameConfig {
    pub round_number: u64,              // Round number
    pub state: u8,                      // State: 0 = Not started, 1 = Active, 2 = Round ended, 3 = Game finished
    pub current_key_price: u64,         // Current ticket price (denominated in $USDT_DECIMALS)
    pub end_time: i64,                  // Round end time (Unix timestamp)
    pub last_buyer_key: Pubkey,         // Last buyer's key
    pub last_buyer_time: i64,           // Timestamp of the last buyer (Unix timestamp)
    pub jackpot_pool: u64,              // Current jackpot pool
    pub dividend_pool: u64,             // Current dividend pool
    pub next_round_pool: u64,           // Next round seed pool
    pub leaderboard_pool: u64,          // Leaderboard/invite reward pool balance
    pub random_reward_pool: u64,        // Random reward pool
    pub total_key_count: u64,           // Total ticket count
    pub total_shadow_count: u64,        // Total shadow ticket count
    pub authority: Pubkey,              // Program authority
    pub treasury_usdt_bump: u8,         // USDT treasury bump
    pub treasury_han_bump: u8,          // HAN treasury bump
    pub bump: u8,                       // Game config bump
}


#[account]
#[derive(InitSpace)]
pub struct UserAccount {
    pub key_count: u64, // Number of tickets purchased
    pub total_usdt_spent: u64, // Total USDT spent
    pub total_usdt_earned: u64, // Total USDT earned
    pub total_withdrawn_usdt: u64, // Total USDT withdrawn
    pub total_han_earned: u64, // Total HAN earned
    pub total_withdrawn_han: u64, // Total HAN withdrawn
    pub last_key_purchase_time: i64, // Last ticket purchase time (Unix timestamp)
    pub bump: u8,
}

