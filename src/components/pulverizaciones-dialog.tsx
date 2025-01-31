'use client';

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from './ui/drawer';
import { Droplet, Trash2 } from 'lucide-react';

import { AddOrEditCampoDialog } from './campos-dialog';
import AddOrEditPulverizacionForm from './pulverizaciones-form';
import { Button } from './ui/button';
import Cookies from 'js-cookie';
import { UUID } from 'crypto';
import { deletePulverizacion } from '@/services/pulverizaciones.service';
import revalidate from '@/lib/actions';
import { toast } from 'sonner';
import { useDialog } from '@/hooks/use-dialog';
import { useRouter } from 'next/navigation';

export const AddOrEditPulverizacionDialog = () => {
  const { open, setOpen, handleOpen } = useDialog();
  const addCampoDialog = useDialog();

  return (
    <>
      <Drawer dismissible={false} open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          <Button>
            Crear
            <Droplet />
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Nueva pulverización</DrawerTitle>
            <DrawerDescription>
              Completa con lo requerido para la pulverización
            </DrawerDescription>
          </DrawerHeader>
          <AddOrEditPulverizacionForm
            handleOpen={handleOpen}
            handleAddCampoDialog={() => {
              handleOpen();
              setTimeout(() => addCampoDialog.handleOpen(), 250);
            }}
          />
          <DrawerFooter className='pt-2'>
            <DrawerClose asChild>
              <Button variant={'outline'} onClick={() => setOpen(false)}>
                Cerrar
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
      <AddOrEditCampoDialog
        hidden
        customOpen={addCampoDialog.open}
        customSetOpen={addCampoDialog.setOpen}
        customHandleOpen={addCampoDialog.handleOpen}
      />
    </>
  );
};

export const DeletePulverizacionDialog = ({ id }: { id: UUID }) => {
  const { push } = useRouter();

  const handleDelete = async () => {
    try {
      const access_token = Cookies.get('access_token');
      if (!access_token) {
        toast.error('La sesión ha expirado', { position: 'top-center' });
        push('/');

        return;
      }

      await deletePulverizacion(id, access_token);
      await revalidate('pulverizaciones');

      toast.success('La pulverizacion fue eliminada.');

      push('/');
    } catch (error) {
      if (error instanceof Error)
        toast.error(error.message, { className: 'mb-[216px]' });
    }
  };

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant={'destructive'} size={'icon'}>
          <Trash2 />
        </Button>
      </DrawerTrigger>
      <DrawerContent className='z-50'>
        <DrawerHeader>
          <DrawerTitle>¿Estás seguro?</DrawerTitle>
          <DrawerDescription>
            Esta acción no se puede deshacer
          </DrawerDescription>
        </DrawerHeader>
        <DrawerFooter>
          <Button variant={'destructive'} onClick={handleDelete}>
            Eliminar
          </Button>
          <DrawerClose asChild>
            <Button variant={'outline'}>Cerrar</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
