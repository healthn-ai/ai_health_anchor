#![allow(clippy::result_large_err)]
use anchor_lang::prelude::*;

mod instructions;
mod error;
mod state;
pub mod constants;

use instructions::*;
pub use constants::*;

declare_id!("54XW2dzuyZva1Tsap8HdSh74FhCVoocGhd8jj4tMtkgu");

#[program]
pub mod ai_health_anchor {
    use super::*;

    pub fn initialize_config(ctx: Context<InitializeConfig>) -> Result<()> {
        initialize::initialize_config(ctx)
    }

    pub fn buy_key(ctx: Context<BuyKey>, round_number: u64, count: u64, referral_key: Option<Pubkey>) -> Result<()> {
        buy_key::buy_key(ctx, round_number, count, referral_key)
    }        

    pub fn reward(ctx: Context<Reward>, usdt_amount: u64) -> Result<()> {
        reward::reward(ctx, usdt_amount)
    }

    pub fn reward_han(ctx: Context<RewardHan>, han_amount: u64) -> Result<()> {
        reward::reward_han(ctx, han_amount)
    }

    pub fn claim(ctx: Context<Claim>) -> Result<()> {
        claim::claim(ctx)
    }

    pub fn claim_han(ctx: Context<ClaimHan>) -> Result<()> {
        claim::claim_han(ctx)
    }


    pub fn start(ctx: Context<START>) -> Result<()> {
        start::start(ctx)
    }

    pub fn stop(ctx: Context<Stop>) -> Result<()> {
        stop::stop(ctx)
    }

    pub fn create_user_account(ctx: Context<CreateUserAccount>) -> Result<()> {
        user_account::create_user_account(ctx)
    }
}


