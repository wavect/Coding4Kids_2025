import { Contract } from "@ethersproject/contracts";
import { shortenAddress, useCall, useEthers, useLookupAddress } from "@usedapp/core";
import React, { useEffect, useState } from "react";
import { formatUnits } from "@ethersproject/units";

import { Body, Button, Container, Header, Image, Link } from "./components";
import logo from "./ethereumLogo.png";
import { abis, addresses } from "@my-app/contracts";

function WalletButton() {
  const [rendered, setRendered] = useState("");

  const { account, activateBrowserWallet, deactivate, error } = useEthers();


  useEffect(() => {
    if (account) {
      setRendered(shortenAddress(account));
    } else {
      setRendered("");
    }
  }, [account, setRendered]);

  useEffect(() => {
    if (error) {
      console.error("Error while connecting wallet:", error.message);
    }
  }, [error]);

  return (
    <Button
      onClick={() => {
        if (!account) {
          activateBrowserWallet();
        } else {
          deactivate();
        }
      }}
    >
      {rendered === "" && "Connect Wallet"}
      {rendered !== "" && rendered}
    </Button>
  );
}

function App() {
  // Read more about useDapp on https://usedapp.io/
  const { error: contractCallError, value: tokenBalance } =
    useCall({
       contract: new Contract(addresses.ceaErc20, abis.erc20),
       method: "balanceOf",
       args: ["0x3f8CB69d9c0ED01923F11c829BaE4D9a4CB6c82C"],
    }) ?? {};

  // Get token decimals for proper formatting
  const { value: tokenDecimals } =
    useCall({
       contract: new Contract(addresses.ceaErc20, abis.erc20),
       method: "decimals",
       args: [],
    }) ?? {};

  // Get token symbol for display
  const { value: tokenSymbol } =
    useCall({
       contract: new Contract(addresses.ceaErc20, abis.erc20),
       method: "symbol",
       args: [],
    }) ?? {};

  // Format the token balance properly
  const formatTokenBalance = (balance: any, decimals: any) => {
    if (!balance || !decimals) return null;
    try {
      return formatUnits(balance, decimals);
    } catch (error) {
      console.error("Error formatting token balance:", error);
      return balance.toString();
    }
  };

  const formattedBalance = formatTokenBalance(tokenBalance, tokenDecimals);
 
  return (
    <Container>
      <Header>
        <WalletButton />
      </Header>
      <Body>
        <Image src={logo} alt="ethereum-logo" />
        Willkommen bei Coding4Kids
        
        {/* Error display */}
        {contractCallError && (
          <div style={{ color: "red", marginTop: "10px" }}>
            <p>Contract call error: {contractCallError.message}</p>
          </div>
        )}

        {/* Token balance display */}
        {formattedBalance && (
          <p style={{ marginTop: "15px", fontSize: "18px", fontWeight: "bold" }}>
            Token Balance: {formattedBalance} {tokenSymbol || "tokens"}
          </p>
        )}

        {/* Loading state */}
        {!contractCallError && !tokenBalance && (
          <p style={{ marginTop: "15px", color: "#888" }}>
            Loading token balance...
          </p>
        )}
      </Body>
    </Container>
  );
}

export default App;
