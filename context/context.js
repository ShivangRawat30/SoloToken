import { createContext, useState, useEffect, useContext, useMemo } from "react";
import { BN } from "@project-serum/anchor";
import {
  SystemProgram,
  LAMPORTS_PER_SOL,
  PublicKey,
  Keypair,
  Transaction,
} from "@solana/web3.js";
import {
  useAnchorWallet,
  useConnection,
  useWallet,
} from "@solana/wallet-adapter-react";
import bs58 from "bs58";
import {
  createTransferInstruction,
  getOrCreateAssociatedTokenAccount,
} from "@solana/spl-token";
import "dotenv/config";

import {
  getLotteryAddress,
  getMasterAddress,
  getProgram,
  getTicketAddress,
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
  const [keyPair, setKeyPair] = useState();
  const [intialized, setIntialized] = useState(false);

  // Get provider
  const { connection } = useConnection();
  const wallet = useWallet();
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
      console.log(ticketBought, ticket);
      setTicket(userTickets[0]);
      setMyTicketId(userTickets[0].account.id);
      setMyTicketAddress(userTickets[0].publicKey);

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
    const now = new Date().getTime();
    const win = Number(windowTime) * 1000 - now;
    const end = Number(endTime) * 1000 - now;
    if (lottery.winnerId) {
      setError("Winner Already Exists");
      toast.error("Winner Already Exists");
    } else if ((win < 0 || end < 0) && windowTime && endTime) {
      setError("Lottery has ended");
      toast.error("Lottery has ended");
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
    console.log(myTicketId, myTicketAdress);
    const now = new Date().getTime();
    const win = Number(windowTime) * 1000 - now;
    const end = Number(endTime) * 1000 - now;
    if (lottery.winnerId) {
      setError("Winner Already Exists");
      toast.error("Winner Already Exists");
    } else if ((win < 0 || end < 0) && windowTime && endTime) {
      setError("Lottery has ended");
      toast.error("Lottery has ended");
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
    if (windowDifference < 0 || endDifference < 0) {
      setError("Lottery is not ended");
      toast.error("Lottery is not ended");
    } else if (lottery.winnerId) {
      setError("Winner Already Exists");
      toast.error("Winner Already Exists");
    } else {
      try {
        console.log(lotteryId, currlotteryAddress, wallet.publicKey);
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
        console.error(err.message);
        setError(err.message);
        toast.error(err.message);
      }
    }
  };

  const claimPrize = async () => {
    console.log("claimPrize");
    setError("");
    setSuccess("");
    try {
      const ticketAddres = await getTicketAddress(
        currlotteryAddress,
        lottery.winnerId
      );
      const ticket = await program.account.ticket.fetch(ticketAddres);
      console.log(
        lotteryId,
        ticket.authority,
        currlotteryAddress,
        wallet.publicKey
      );
      const txHash = await program.methods
        .claimPrize(lotteryId)
        .accounts({
          lottery: currlotteryAddress,
          winner: ticket.authority,
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
  const initializeKeypair = () => {
    const privateKey = new Uint8Array(bs58.decode(process.env.SECRET_KEY));
    const keypair = Keypair.fromSecretKey(privateKey);
    console.log(
      `Initialized Keypair: Public Key - ${keypair.publicKey.toString()}`
    );

    return keypair;
  };

  const transferToken = async () => {
    console.log("transferToken");
    setError("");
    setSuccess("");
    const ac = initializeKeypair();
    const fromATA = new PublicKey(process.env.FROM_ASSOCIATED_TOKEN_ACCOUNT);
    const mintAddress = new PublicKey(process.env.MINT_ID);
    const toAta = await getOrCreateAssociatedTokenAccount(
      connection,
      ac,
      mintAddress,
      currlotteryAddress,
      true
    );
    // const amount = new BN(40);
    console.log(toAta.address.toBase58());
    console.log(fromATA, wallet.publicKey);
    try {
      const it = lottery.lastTicketId;
      console.log(it);
      const instructions = [];
      for (let i = 1; i <= it; i++) {
        const currTicket = await getTicketAddress(currlotteryAddress, i);
        const Ata = await getOrCreateAssociatedTokenAccount(
          connection,
          ac,
          mintAddress,
          currTicket,
          true
        );

        const tx = new Transaction();
        tx.add(
          createTransferInstruction(
            fromATA,
            Ata.address,
            wallet.publicKey,
            10000
          )
        );
        instructions.push(tx);
      }

      const block = await connection.getLatestBlockhash();
      instructions.forEach((ta) => {
        ta.recentBlockhash = block.blockhash;
        ta.feePayer = wallet.publicKey;
      });
      console.log(instructions, wallet.publicKey.toBase58);
      const signedTransaction = await wallet.signAllTransactions(instructions);
      console.log(
        "user has signed " + signedTransaction.length + " transactions"
      );
      updateState();
      setTokenTransfered(true);
      toast.success("Token has been Transferred to the users");
    } catch (err) {
      console.error(err);
      setError(err.message);
      toast.error(err);
    }
  };

  return (
    <AppContext.Provider
      value={{
        isMasterInitialized: intialized,
        connected: wallet?.publicKey ? true : false,
        isMasterAuthority:
          wallet?.publicKey &&
          master &&
          wallet?.publicKey.toBase58() === master.authority.toBase58()
            ? true
            : false,
        isLotteryAuthority:
          wallet?.publicKey &&
          lottery &&
          wallet?.publicKey.toBase58() === master.authority.toBase58()
            ? true
            : false,
        lotteryId,
        lotteryPlayers,
        startTime,
        windowTime,
        endTime,
        tokenClaim: ticket && ticket.account.tokenClaimed === false,
        isFinished: lottery && lottery.winnerId,
        canClaim: lottery && !lottery.claimed,
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
        ticketBought,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  return useContext(AppContext);
};
