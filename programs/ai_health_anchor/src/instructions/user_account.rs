use anchor_lang::prelude::*;
use crate::{ANCHOR_DISCRIMINATOR, state::*};


pub fn create_user_account(ctx: Context<CreateUserAccount>) -> Result<()> {
    let user_account = &mut ctx.accounts.user_account;
    user_account.bump = ctx.bumps.user_account;
    Ok(())
}

#[derive(Accounts)]
pub struct CreateUserAccount<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        init_if_needed,
        payer = user,
        space = ANCHOR_DISCRIMINATOR + UserAccount::INIT_SPACE,
        seeds = [b"user_account", user.key().as_ref()],
        bump,
    )]
    pub user_account: Account<'info, UserAccount>,

    pub system_program: Program<'info, System>,

}
