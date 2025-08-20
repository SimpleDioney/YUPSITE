import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { UpdateUserForm } from "@/components/auth/UpdateUserForm";
import { UpdatePasswordForm } from "@/components/auth/UpdatePasswordForm";

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-foreground mb-6">
            Meu Perfil
          </h1>
          <div className="space-y-8">
            <UpdateUserForm />
            <UpdatePasswordForm />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}