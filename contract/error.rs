use anchor_lang::prelude::error_code;

#[error_code]
pub enum LotteryError {
    #[msg("Winner already exists.")]
    WinnerAlreadyExists,
    #[msg("Can't choose a Winner when there are no tickets.")]
    NoTickets,
    #[msg("Winner has not been chosen.")]
    WinnerNotChosen,
    #[msg("Invalid Number.")]
    InvalidWinner,
    #[msg("No One is the Wineer")]
    NoWinner,
    #[msg("The prize has already been claimed.")]
    AlreadyClaimed,
    #[msg("Ticket already exists")]
    TicketAlreadyExists,
}