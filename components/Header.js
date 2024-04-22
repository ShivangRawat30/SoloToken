import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import { MdWallet } from "react-icons/md";

import style from "../styles/Header.module.css";

const Header = () => {
  const { connected } = useWallet();
  return (
    <div className={style.wrapper}>
      <h1 className={style.logo}>Solo token</h1>
      <WalletMultiButton className={style.walletButton}>
        {connected ? (
          "Disconnect"
        ) : (
          <>
          Connect
            <MdWallet
              className={style.walletIcon}
            />
          </>
        )}
      </WalletMultiButton>
    </div>
  );
};

export default Header;
