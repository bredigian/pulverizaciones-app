import { Campo, Coordinada, Lote } from '@/types/campos.types';
import { Check, Eraser, MapPinPlusInside } from 'lucide-react';
import { addCampo, editCampo } from '@/services/campos.service';

import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import Map from './map';
import { ReloadIcon } from '@radix-ui/react-icons';
import { cn } from '@/lib/utils';
import revalidate from '@/lib/actions';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { useState } from 'react';

export default function AddOrEditCampoForm({
  isEdit,
  data,
}: {
  isEdit?: boolean;
  data?: Campo;
}) {
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<Campo>({
    defaultValues: isEdit
      ? { nombre: data?.nombre, hectareas: data?.hectareas }
      : undefined,
  });

  const [isSubmitSuccessful, setIsSubmitSuccessful] = useState<
    boolean | undefined
  >(undefined);

  const onInvalidSubmit = (errors) => {
    if (errors.nombre)
      toast.error(errors.nombre.message, {
        className: `mt-6`,
        position: 'top-center',
      });
    if (errors.hectareas)
      toast.error(errors.hectareas.message, {
        className: `mt-6`,
        position: 'top-center',
      });
  };
  const onSubmit = async (values: Campo) => {
    try {
      const PAYLOAD: Campo = {
        ...values,
        id: data?.id,
        hectareas: parseInt(values.hectareas.toString()),
      };
      if (!isEdit) await addCampo(PAYLOAD);
      else await editCampo(PAYLOAD);
      await revalidate('campos');

      setIsSubmitSuccessful(true);

      toast.success(
        !isEdit ? 'Campo agregado con éxito.' : 'Campo modificado con éxito.',
      );
    } catch (error) {
      if (error instanceof Error) toast.error(error.message);
    }
  };

  const [enable, setEnable] = useState(false);

  const [lotes, setLotes] = useState<Lote[]>([]);
  const addLote = (lote: Lote) => setLotes((prev) => [...prev, lote]);

  const [lote, setLote] = useState<Lote>({
    nombre: '',
    zona: [],
    color: '#000000',
  });
  const handleLote = (point: Coordinada) => {
    console.log(point);
    setLote((prev) => ({ ...prev, zona: [...prev.zona, point] }));
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit, onInvalidSubmit)}
      className='space-y-4 px-4'
    >
      <Input
        {...register('nombre', {
          required: { value: true, message: 'El nombre es requerido.' },
          minLength: {
            value: 4,
            message: 'Debe contener al menos 4 caracteres.',
          },
        })}
        placeholder='Nombre'
        className='text-sm'
      />
      <Input
        {...register('hectareas', {
          required: { value: true, message: 'Las hectáreas son requeridas.' },
          min: {
            value: 1,
            message: 'El valor mínimo es 1.',
          },
        })}
        placeholder='Hectáreas'
        className='text-sm'
      />
      <div className='w-full space-y-4'>
        <div className='flex items-center justify-between'>
          <Label>Ubicación</Label>
          <aside className='flex items-center gap-2'>
            <Button
              variant={'outline'}
              onClick={() => {
                if (!enable) setEnable(true);
                else {
                  if (!lote.nombre) {
                    toast.error('El nombre de lote es requerido', {
                      className: `mt-6`,
                      position: 'top-center',
                    });
                    return;
                  }
                  console.log(lote);
                  addLote(lote as Lote);
                  setLote({
                    nombre: '',
                    zona: [],
                    color: lote.color as string,
                  });
                  setEnable(false);
                }
              }}
              type='button'
            >
              {!enable ? (
                <>
                  Agregar lote <MapPinPlusInside />
                </>
              ) : (
                <>
                  Finalizar <Check />
                </>
              )}
            </Button>
            <Button
              variant={'destructive'}
              size={'icon'}
              onClick={() =>
                setLote((prev) => ({
                  ...prev,
                  zona: [],
                }))
              }
              disabled={!enable}
              type='button'
            >
              <Eraser />
            </Button>
          </aside>
        </div>
        <Map
          lotes={lotes}
          actualLote={lote}
          handleLote={handleLote}
          enable={enable}
        />
        <ul className='flex items-center gap-2'>
          {lotes.length === 0 ? (
            <li className='rounded-md border-2 border-gray-200 bg-gray-50/50 px-3 py-1 text-xs font-semibold'>
              Sin lotes
            </li>
          ) : (
            lotes.map((lote) => (
              <li
                key={`badge-${lote.nombre}`}
                style={{
                  backgroundColor: `${lote.color as string}50`,
                  borderColor: lote.color as string,
                }}
                className='rounded-md border-2 px-3 py-1 text-xs font-semibold'
              >
                {lote.nombre}
              </li>
            ))
          )}
        </ul>
        <div className='grid grid-cols-6 gap-4'>
          <Input
            placeholder='Nombre del lote'
            className='col-span-4 text-sm'
            disabled={!lote.nombre && !enable}
            onChange={(e) =>
              setLote((prev) => ({ ...prev, nombre: e.target.value }))
            }
            value={lote.nombre as string}
          />
          <Input
            type='color'
            placeholder='color'
            className='col-span-2'
            onChange={(e) =>
              setLote((prev) => ({ ...prev, color: e.target.value }))
            }
            value={lote.color as string}
          />
        </div>
      </div>
      <Button
        disabled={isSubmitting || isSubmitSuccessful}
        type='submit'
        className={cn('w-full', isSubmitSuccessful && 'bg-green-700')}
      >
        {isSubmitSuccessful ? (
          <>
            Completado <Check />
          </>
        ) : !isSubmitting ? (
          !isEdit ? (
            'Agregar'
          ) : (
            'Modificar'
          )
        ) : (
          <>
            Procesando
            <ReloadIcon className='animate-spin' />
          </>
        )}
      </Button>
    </form>
  );
}
