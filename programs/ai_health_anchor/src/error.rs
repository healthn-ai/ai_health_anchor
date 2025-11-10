use anchor_lang::prelude::*;

#[error_code]
pub enum CustomErrorCode {
    #[msg("Custom error message")]
    CustomError,

    #[msg("Insufficient buy amount")]
    InsufficientBuyAmount,

    #[msg("Insufficient funds")]
    InsufficientFunds,

    #[msg("Invalid authority")]
    InvalidAuthority,

    #[msg("Insufficient withdraw amount")]
    InsufficientWithdrawAmount,

    #[msg("Invalid mint")]
    InvalidMint,

    #[msg("Invalid owner")]
    InvalidOwner,

    #[msg("Invalid round number")]
    InvalidRoundNumber,
    
    #[msg("Reward less than total earned")]
    RewardLessThanTotalEarned,

    #[msg("Invalid state")]
    InvalidState,

    #[msg("Over end time")]
    OverEndTime,

    #[msg("Not over end time")]
    NotOverEndTime,
    
    #[msg("Remaining balance")]
    Remainingbalance
}
