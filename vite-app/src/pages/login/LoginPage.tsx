import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { Button } from "@/shared/components/ui/button";
import { Colors } from "@/shared/constants/colors";
import { Input } from "@/components/ui/input";
import { PhoneIcon } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import stockImage from "@/shared/assets/images/stock-warehouse-scanning.webp";
import { toast } from "sonner";
import { useState } from "react";
import { useUserActions } from "@/entities/user/hooks/useUser";

export const LoginPage = () => {
  const { isLoggingIn, loginUser, setJwtToken } = useUserActions();
  const [phone, setPhone] = useState("");

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newPhone = '';
    for (let i = 0; i < e.target.value.length; i++) {
      if (i === 0 || i % 3 === 0) newPhone += ' ';
      newPhone += e.target.value[i];
    }
    setPhone(newPhone);
  };

  const handleLoginButtonClick = () => {
    loginUser({ phone: phone.replaceAll(/\D/, '') })
      .then(res => setJwtToken({ token: res.data.token }))
      .catch(err => toast.error(`Ошибка входа: ${(err as { message?: string })?.message}`))
  }

  return (
    <div>
      <img src={stockImage} alt="logo" />
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-h1">Вход</CardTitle>
          <CardDescription>
            <PhoneIcon color={Colors.Primary} />
            <p className="text-secondary">Для входа укажите свой номер телефона</p>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Input type="tel" placeholder="+7" value={phone} onChange={handlePhoneChange} />
          <Button onClick={handleLoginButtonClick} variant="default" disabled={!phone}>
            {isLoggingIn && <Spinner />}
            <p className="text-button text-white">{isLoggingIn ? 'Входим' : 'Войти' }</p>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}