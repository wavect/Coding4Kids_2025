import "./index.css";

import { ApolloClient, ApolloProvider, InMemoryCache } from "@apollo/client";
import { Chain, DAppProvider, DEFAULT_SUPPORTED_CHAINS, Sepolia } from "@usedapp/core";
import React from "react";
import ReactDOM from "react-dom";

import App from "./App";

const Boba: Chain = {
  chainId: 11155111,
  chainName: 'Sepolia',
  isTestChain: true,
  isLocalChain: false,
  multicallAddress: '0x0000000000000000000000000000000000000000',
  getExplorerAddressLink: (address: string) => `https://sepolia.etherscan.io/address/${address}`,
  getExplorerTransactionLink: (transactionHash: string) => `https://sepolia.etherscan.io/tx/${transactionHash}`,
  // Optional parameters:
  rpcUrl: 'https://ethereum-sepolia-rpc.publicnode.com',
  blockExplorerUrl: 'https://sepolia.etherscan.io/',
  nativeCurrency: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
  }
}

const config = {
  readOnlyChainId: Sepolia.chainId,
  readOnlyUrls: {
    [Sepolia.chainId]: Sepolia.rpcUrl,
  },
  networks: [...DEFAULT_SUPPORTED_CHAINS, Boba]
}

// You should replace this url with your own and put it into a .env file
// See all subgraphs: https://thegraph.com/explorer/
const client = new ApolloClient({
  cache: new InMemoryCache(),
  uri: "https://api.thegraph.com/subgraphs/name/paulrberg/create-eth-app",
});


ReactDOM.render(
  <DAppProvider config={config as any}>
    <ApolloProvider client={client}>
      <App />
    </ApolloProvider>
  </DAppProvider>,
document.getElementById("root"),
);
