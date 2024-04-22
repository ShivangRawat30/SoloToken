import style from "../styles/TableRow.module.css";
import { shortenPk } from "../utils/helper";
import { SiSolana } from "react-icons/si";

const TableRow = ({
  lotteryId,
  winnerAddress = "4koeNJ39zejjuCyVQdZmzsx28CfJoarrv4vmsuHjFSB6",
  winnerId,
  prize,
}) => {
  return (
    <div className={style.wrapper}>
      <div>#{lotteryId}</div>
      <div className={style.money}>{shortenPk(winnerAddress)} <SiSolana className={style.solanaicon}/></div>
      <div>#{winnerId}</div>
      <div>+{prize} SOL</div>
      <div>+{prize} SOL</div>
      <div>+{prize} SOL</div>
    </div>
  );
};

export default TableRow;
