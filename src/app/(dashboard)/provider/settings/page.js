import ChangePasswordForm from "@/components/shared/ChangePasswordForm";
import WhatsAppSettingsForm from "@/components/shared/WhatsAppSettingsForm";

export default function ProviderSettingsPage() {
    return (
        <div className="flex flex-col gap-6">
            <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
            <ChangePasswordForm />
            <WhatsAppSettingsForm />
        </div>
    );
}