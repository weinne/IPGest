import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Avatar, AvatarImage, AvatarFallback } from '@chakra-ui/react'; // Assuming Chakra UI
import { FormItem, FormControl, Input, FormMessage } from '@chakra-ui/react'; // Assuming Chakra UI


interface FormData {
  foto?: File;
  // other form fields...
}

interface User {
  username?: string;
  foto_url?: string;
  // other user properties
}

const MyForm: React.FC<{ user?: User }> = ({ user }) => {
  const [preview, setPreview] = useState<string>();
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    // ... other useForm options
  });

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setPreview(URL.createObjectURL(file));
    }
  };

  const onSubmit = (data: FormData) => {
    // Handle form submission, including file upload
    console.log(data);
    // Implement your file upload logic here (e.g., using fetch or axios)

  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="flex flex-col items-center gap-4 mb-4">
        <Avatar className="h-24 w-24">
          {preview ? (
            <AvatarImage src={preview} alt="Preview" />
          ) : user?.foto_url ? (
            <AvatarImage src={`/uploads/${user.foto_url}`} alt="User photo" />
          ) : (
            <AvatarFallback>
              {user?.username?.charAt(0).toUpperCase()}
            </AvatarFallback>
          )}
        </Avatar>
        <FormItem>
          <FormControl>
            <Input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              {...register('foto')}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      </div>
      {/* Rest of your form */}
    </form>
  );
};

export default MyForm;