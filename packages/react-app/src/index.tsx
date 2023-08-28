import "./index.css";

import { ApolloClient, ApolloProvider, InMemoryCache } from "@apollo/client";
import { Chain, DAppProvider, DEFAULT_SUPPORTED_CHAINS } from "@usedapp/core";
import React from "react";
import ReactDOM from "react-dom";

import App from "./App";

const Boba: Chain = {
  chainId: 2888,
  chainName: 'Boba Goerli',
  isTestChain: true,
  isLocalChain: false,
  multicallAddress: '0xFB552029226c907b54fD272C04724CC674058827',
  getExplorerAddressLink: (address: string) => `https://testnet.bobascan.com/address/${address}`,
  getExplorerTransactionLink: (transactionHash: string) => `https://testnet.bobascan.com/tx/${transactionHash}`,
  // Optional parameters:
  rpcUrl: 'https://goerli.boba.network',
  blockExplorerUrl: 'https://testnet.bobascan.com/',
  nativeCurrency: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
  }
}

const config = {
  readOnlyChainId: Boba.chainId,
  readOnlyUrls: {
    [Boba.chainId]: Boba.rpcUrl,
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
