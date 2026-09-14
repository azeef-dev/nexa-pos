import ChatWidget from "@/components/shared/ChatWidget";

export default function ProviderLayout({ children }) {
    return (
        <>
            {children}
            <ChatWidget />
        </>
    );
}
