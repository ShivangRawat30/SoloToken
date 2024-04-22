import { createContext, useState, useEffect, useContext, useMemo } from "react";
import { BN } from "@project-serum/anchor";
import {
  SystemProgram,
  LAMPORTS_PER_SOL,
  PublicKey,
  Keypair,
} from "@solana/web3.js";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import bs58 from "bs58";
import { env } from "process";
import TOKEN_PROGRAM_ID, {
  createAssociatedTokenAccount,
  createAssociatedTokenAccountIdempotent,
  getAccount,
  getAssociatedTokenAddress,
  getOrCreateAssociatedTokenAccount,
} from "@solana/spl-token";

import {
  getLotteryAddress,
  getMasterAddress,
  getProgram,
  getTicketAddress,
  getTotalPrize,
  lotteryAssociateTokenAccount,
} from "../utils/program";
import { confirmTx, mockWallet } from "../utils/helper";
import toast from "react-hot-toast";

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [masterAddress, setMasterAddress] = useState();
  const [master, setMaster] = useState();
  const [currlotteryAddress, setCurrLotteryAddress] = useState();
  const [lotteryTotalPlayers, setLotteryPlayers] = useState();
  const [lottery, setLottery] = useState();
  const [startTime, setStartTime] = useState();
  const [windowTime, setWindowTime] = useState();
  const [endTime, setEndTime] = useState();
  const [lotteryPlayers, setPlayers] = useState([]);
  const [myTicketId, setMyTicketId] = useState();
  const [lotteryId, setLotteryId] = useState();
  const [myTicketAdress, setMyTicketAddress] = useState();
  const [ticket, setTicket] = useState();
  const [ticketBought, setTicketBought] = useState();
  const [userWinningId, setUserWinningId] = useState(false);
  const [tokenTransfered, setTokenTransfered] = useState(false);
  const [error, setError] = useState("");
  const [lotteryTotalDeposit, setLotteryTotalDeposit] = useState();
  const [success, setSuccess] = useState("");
  const [intialized, setIntialized] = useState(false);

  // Get provider
  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  const program = useMemo(() => {
    if (connection) {
      return getProgram(connection, wallet ?? mockWallet());
    }
  }, [connection, wallet]);

  useEffect(() => {
    updateState();
  }, [program]);

  useEffect(() => {
    if (!lottery) return;
  }, [lottery]);

  const updateState = async () => {
    if (!program) return;
    try {
      // master
      if (!masterAddress) {
        const masterAddress = await getMasterAddress();
        setMasterAddress(masterAddress);
      }
      const master = await program.account.master.fetch(
        masterAddress ?? (await getMasterAddress())
      );
      setIntialized(true);
      setMaster(master);
      setLotteryId(master.lastId);

      // lottery
      const lotteryAddress = await getLotteryAddress(master.lastId);
      const lottery = await program.account.lottery.fetch(lotteryAddress);

      setCurrLotteryAddress(lotteryAddress);
      setLottery(lottery);
      setStartTime(lottery.startTime);
      setWindowTime(lottery.windowTime);
      setEndTime(lottery.lastTime);
      setLotteryPlayers(lottery.lastTicketId);
      setLotteryTotalDeposit(lottery.totalAmount);

      console.log(currlotteryAddress);
      // const ticketAddres = await getTicketAddress(currlotteryAddress, lottery.lastTicketId);
      // const tic = await program.account.ticket.fetch(ticketAddres);
      // console.log(tic);
      // Get user's tickets for the current lottery
      if (!wallet?.publicKey) return;
      const userTickets = await program.account.ticket.all([
        {
          memcmp: {
            bytes: bs58.encode(new BN(lotteryId).toArrayLike(Buffer, "le", 4)),
            offset: 12,
          },
        },
        { memcmp: { bytes: wallet.publicKey.toBase58(), offset: 16 } },
      ]);
      setTicketBought(userTickets[0].account.ticketPurchased);
      setTicket(userTickets[0]);
      setMyTicketAddress(ticket.publicKey);

      const val = 4294967295;
      // Check whether any of the user tickets win
      const userWin = userTickets.some(
        (t) => t.account.id === lottery.winnerId
      );
      if (userWin) {
        setUserWinningId(lottery.winnerId);
      } else if (Number(lottery.winnerId) === val) {
        setUserWinningId(val);
      } else {
        setUserWinningId(null);
      }
    } catch (err) {
      console.log(err.message);
    }
  };

  const initMaster = async () => {
    setError("");
    setSuccess("");
    console.log("Running");
    try {
      const txHash = await program.methods
        .initMaster()
        .accounts({
          master: masterAddress,
          payer: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      await confirmTx(txHash, connection);

      updateState();
      toast.success("Initialized Master");
    } catch (err) {
      setError(err.message);
      toast.error("Initializing FAILED!");
    }
  };

  const createLottery = async () => {
    setError("");
    setSuccess("");
    try {
      const lotteryAddress = await getLotteryAddress(lotteryId + 1);
      const txHash = await program.methods
        .createLottery()
        .accounts({
          lottery: lotteryAddress,
          master: masterAddress,
          authority: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      await confirmTx(txHash, connection);
      updateState();
      toast.success("Lottery Created!");
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    }
  };

  const buyTicket = async () => {
    setError("");
    setSuccess("");
    let now = new Date().getTime();
    if (
      now >= Number(lottery.windowTime) * 10000 &&
      lottery.windowTime != null &&
      now >= Number(lottery.endTime) * 1000 &&
      lottery.windowTime != null
    ) {
      setError("Cannot Enter the lottery");
      toast.error("Cannot Enter the lottery");
    } else if (lottery.winnerId) {
      setError("Winner Already Exists");
      toast.error("Winner Already Exists");
    } else {
      try {
        console.log("BUYING");
        const ticketAddres = await getTicketAddress(
          currlotteryAddress,
          lottery.lastTicketId + 1
        );
        const txHash = await program.methods
          .buyTicket(lotteryId)
          .accounts({
            lottery: currlotteryAddress,
            ticket: ticketAddres,
            master: masterAddress,
            buyer: wallet.publicKey,
            owner: master.authority,
            systemProgram: SystemProgram.programId,
          })
          .rpc();
        await confirmTx(txHash, connection);
        toast.success("Bought a Ticket!");
        updateState();
      } catch (err) {
        setError(err.message);
        toast.error(err.message);
      }
    }
  };

  const buyMoreTicket = async () => {
    setError("");
    setSuccess("");
    let now = new Date().getTime();
    if (
      now >= Number(lottery.windowTime) * 10000 &&
      lottery.windowTime != null &&
      now >= Number(lottery.endTime) * 1000 &&
      lottery.windowTime != null
    ) {
      setError("Cannot Enter the lottery");
      toast.error("Cannot Enter the lottery");
    } else if (lottery.winnerId) {
      setError("Winner Already Exists");
      toast.error("Winner Already Exists");
    } else {
      try {
        console.log("buying More Ticket");
        const txHash = await program.methods
          .buyMoreTicket(lotteryId, myTicketId)
          .accounts({
            lottery: currlotteryAddress,
            ticket: myTicketAdress,
            master: masterAddress,
            buyer: wallet.publicKey,
            owner: master.authority,
            systemProgram: SystemProgram.programId,
          })
          .rpc();
        await confirmTx(txHash, connection);
        toast.success("Bought a Ticket!");
        updateState();
      } catch (err) {
        setError(err.message);
        toast.error(err.message);
      }
    }
  };

  const pickWinner = async () => {
    setError("");
    setSuccess("");
    const now = new Date().getTime();
    const windowDifference = Number(lottery.windowTime) * 10000 - now;
    const endDifference = Number(lottery.endTime) * 10000 - now;
    if (windowDifference > 0 || endDifference > 0) {
      setError("Lottery is not ended");
      toast.error("Lottery is not ended");
    } else if (lottery.winnerId) {
      setError("Winner Already Exists");
      toast.error("Winner Already Exists");
    } else {
      try {
        const txHash = await program.methods
          .pickWinner(lotteryId)
          .accounts({
            lottery: currlotteryAddress,
            authority: wallet.publicKey,
          })
          .rpc();
        await confirmTx(txHash, connection);

        updateState();
        toast.success("Picked winner!");
      } catch (err) {
        setError(err.message);
        toast.error(err.message);
      }
    }
  };

  const claimPrize = async () => {
    setError("");
    setSuccess("");

    try {
      const txHash = await program.methods
        .claimPrize(lotteryId, userWinningId)
        .accounts({
          lottery: currlotteryAddress,
          ticket: myTicketAdress,
          authority: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      await confirmTx(txHash, connection);
      updateState();
      toast.success("The Winner has claimed the prize!!");
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    }
  };

  const transferToken = async () => {
    setError("");
    setSuccess("");

    const TokenPone = new PublicKey(
      "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
    );
    const TokenPtwo = new PublicKey(
      "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
    );
    const fromATA = new PublicKey(
      "Hsjbftz2xXRnGk7q7WsrYUfuDod8XWaSvxb1ome9j8ZZ"
    );
    const tokenOWN = new PublicKey(
      "EbkQ2uzFzvobU7C4ZBZHP3hS6PTdQRreL4CXztDJfMxR"
    );
    // const fromAta = await lotteryAssociateTokenAccount(connection, wallet, mintAddress, wallet.publicKey);
    // console.log(fromAta.address.toString());
    console.log(connection);
    const to = new PublicKey("Dqd3X5DY6m3sJw6u2y7BHVBco27V2xCD9gbZ7bEJwrFe");
    const mintAddress = new PublicKey(
      "Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr"
    );
    console.log(connection, wallet, mintAddress, wallet.publicKey);
    const toAta = await getOrCreateAssociatedTokenAccount(
      connection,
      wallet,
      mintAddress,
      wallet.publicKey,
    );
    const amount = 10;
    console.log(toAta);
    try {
      const txHash = await program.methods
        .transferTokens(lotteryId, amount)
        .accounts({
          lottery: master.lastId,
          tokenOwner: tokenOWN,
          from: wallet,
          fromAta: fromATA,
          toAta: toAta,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      await confirmTx(txHash, connection);
      updateState();
      setTokenTransfered(true);
      toast.success("Token has been Transferred to the lottery");
    } catch (err) {
      setError(err.message);
      toast.error(err);
    }
  };

  const claimTokens = async () => {
    setError("");
    setSuccess("");
    const mintAddress = new PublicKey(
      "Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr"
    );
    const fromATA = new PublicKey(
      "Hsjbftz2xXRnGk7q7WsrYUfuDod8XWaSvxb1ome9j8ZZ"
    );
    const toAta = getOrCreateAssociatedTokenAccount(
      connection,
      wallet,
      mintAddress,
      wallet.publicKey
    );
    if (token.account.claimed) {
      setError("Already Claimed");
      toast.error("Already Claimed");
    } else {
      try {
        const txHash = await program.methods
          .claimTokens(lotteryId, myTicketId)
          .accounts({
            lottery: master.lastId,
            ticket: myTicketId,
            authority: wallet.publicKey,
            from_ata: fromATA,
            to_ata: toAta,
            token_program: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          })
          .rpc();
        await confirmTx(txHash, connection);
        updateState();
        toast.success("Token has been received");
      } catch (err) {
        setError(err.message);
        toast.error(err.message);
      }
    }
  };

  return (
    <AppContext.Provider
      value={{
        isMasterInitialized: intialized,
        connected: wallet?.publicKey ? true : false,
        isMasterAuthority:
          wallet && master && wallet.publicKey.equals(master.authority),
        isLotteryAuthority:
          wallet && lottery && wallet.publicKey.equals(master.authority),
        lotteryId,
        lotteryPlayers,
        startTime,
        windowTime,
        endTime,
        tokenClaim: ticket && ticket.account.tokenClaimed === false,
        isFinished: lottery && lottery.winnerId,
        canClaim: lottery && !lottery.claimed && userWinningId === myTicketId,
        isTransfered:
          lottery &&
          !lottery.claimed &&
          tokenTransfered &&
          userWinningId === 4294967295,
        isAllowedForToken:
          lottery && ticket && lottery.id === ticket.account.id,
        initMaster,
        createLottery,
        buyTicket,
        pickWinner,
        claimPrize,
        error,
        success,
        intialized,
        buyMoreTicket,
        lotteryTotalPlayers,
        userWinningId,
        transferToken,
        master,
        lottery,
        ticket,
        lotteryTotalDeposit,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  return useContext(AppContext);
};
