import { Button } from "@/shared/components/ui/button";

export const WelcomePage = () => {
  return (
    <div className="flex flex-col justify-between align-middle h-full">
      <div className="flex flex-col gap-2 w-[80vw]">
        <h1 className="text-h1">Добро пожаловать</h1>
        <p className="text-main">Для продолжения нажмите кнопку «Войти»</p>
      </div>
      <div className="w-[calc(100vw-30px)]">
        <Button variant="default">
          <p className="text-button text-white">Войти</p>
        </Button>
      </div>
    </div>
  )
};