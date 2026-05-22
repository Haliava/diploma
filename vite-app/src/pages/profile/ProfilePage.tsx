import { useUser } from "@/entities/user/hooks/useUser";

export const ProfilePage = () => {
  const { user } = useUser();

  return (
    <div className="flex flex-col">
      <h1 className="text-h1">Профиль</h1>
      <p className="text-h3">телефон: {user?.phone}</p>
      <p className="text-h3">{user?.role}</p>
    </div>
  )
}