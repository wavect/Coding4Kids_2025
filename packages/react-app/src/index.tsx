import "./index.css";

import { DAppProvider, Sepolia } from "@usedapp/core";
import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";

import App from "./App";
import { rpcRotator } from "./rpcRotator";

// Component wrapper to handle RPC rotation
function AppWithRPCRotation() {
  const [currentRPC, setCurrentRPC] = useState(rpcRotator.getCurrentEndpoint());

  useEffect(() => {
    // Update RPC endpoint every 30 seconds or on failures
    const interval = setInterval(() => {
      const newRPC = rpcRotator.getCurrentEndpoint();
      if (newRPC !== currentRPC) {
        console.log(`Switching to RPC: ${newRPC}`);
        setCurrentRPC(newRPC);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [currentRPC]);

  const config = {
    readOnlyChainId: Sepolia.chainId,
    readOnlyUrls: {
      [Sepolia.chainId]: currentRPC,
    },
    // Add error handling and retry logic
    networks: [
      {
        ...Sepolia,
        rpcUrl: currentRPC,
      }
    ]
  };

  return (
    <DAppProvider config={config as any}>
      <App />
    </DAppProvider>
  );
}


ReactDOM.render(
  <AppWithRPCRotation />,
  document.getElementById("root"),
);
