import React, { createContext, useContext, useState } from "react";

interface AlatContextProps {
  apiError: string;
  setApiError: React.Dispatch<React.SetStateAction<string>>;
  tokenIsLoading: boolean;
  setTokenIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

const AlatContext = createContext<AlatContextProps | undefined>(undefined);
interface AlatContextComponentType {
  children: React.ReactNode;
}
export const AlatContextProvider: React.FC<AlatContextComponentType> = ({
  children,
}) => {
  const [apiError, setApiError] = useState<string>("");
  const [tokenIsLoading, setTokenIsLoading] = useState<boolean>(false);
  const contextValues = {
    apiError,
    setApiError,
    tokenIsLoading,
    setTokenIsLoading,
  };
  return (
    <AlatContext.Provider value={contextValues}>
      {children}
    </AlatContext.Provider>
  );
};

export const useAlatContext = () => {
  const context = useContext(AlatContext);
  if (!context) {
    throw new Error(
      "useAlatcontext must be used within an alatcontextprovider"
    );
  }
  return context;
};
