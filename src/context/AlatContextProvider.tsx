import React ,{ createContext, useContext, useState}from 'react'

interface AlatContextProps {
    apiError:string;
    setApiError:React.Dispatch<React.SetStateAction<string>>
}

const AlatContext = createContext<AlatContextProps | undefined>(undefined)
interface AlatContextComponentType {
    children: React.ReactNode
}
export const AlatContextProvider:React.FC<AlatContextComponentType> = ({children}) => {
    const [apiError, setApiError] = useState<string>("")
    const contextValues = {
apiError, setApiError
    }
  return (
    <AlatContext.Provider value={contextValues}>
        {children}
    </AlatContext.Provider>
  )
}

export const useAlatContext = () => {
    const context = useContext(AlatContext);
    if(!context) {
        throw new Error("useAlatcontext must be used within an alatcontextprovider")
    } return context
}