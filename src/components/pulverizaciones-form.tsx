'use client';

import { Campo, Lote } from '@/types/campos.types';
import { Check, ChevronDown, PackageMinus, PackagePlus } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { useEffect, useState } from 'react';

import { AddOrEditCampoDialog } from './campos-dialog';
import { Button } from './ui/button';
import { Calendar } from './ui/calendar';
import Cookies from 'js-cookie';
import { Input } from './ui/input';
import { Label } from './ui/label';
import LoteItem from './lote-item';
import Map from './map';
import { Pulverizacion } from '@/types/pulverizaciones.types';
import { ReloadIcon } from '@radix-ui/react-icons';
import { UNIDAD } from '@/types/productos.types';
import { UUID } from 'crypto';
import { addPulverizacion } from '@/services/pulverizaciones.service';
import { cn } from '@/lib/utils';
import revalidate from '@/lib/actions';
import { toast } from 'sonner';
import { useControllerAplicaciones } from '@/hooks/use-productos';
import { useDataStore } from '@/store/data.store';
import { useDialog } from '@/hooks/use-dialog';
import { useRouter } from 'next/navigation';

interface Props {
  handleOpen: () => void;
}

export default function AddOrEditPulverizacionForm({ handleOpen }: Props) {
  const { push } = useRouter();

  const {
    getData,
    loading,
    error,
    campos,
    cultivos,
    productos,
    tratamientos,
    isAlreadyFetching,
  } = useDataStore();

  useEffect(() => {
    if (!isAlreadyFetching()) {
      const access_token = Cookies.get('access_token');
      if (!access_token) {
        toast.error('La sesión ha expirado.', { position: 'top-center' });
        push('/');

        return;
      }

      const fetchData = async () => await getData(access_token);
      fetchData();
    }
  }, []);

  const {
    control,
    register,
    handleSubmit,
    formState: { isSubmitting },
    watch,
  } = useForm<Pulverizacion>({});

  const calendarDialog = useDialog();

  const [selectedCampo, setSelectedCampo] = useState<Campo>();
  const [selectedLotes, setSelectedLotes] = useState<string[]>([]);

  const {
    aplicaciones,
    addAplicacion,
    areEmptySelectedProducts,
    deleteAplicacion,
    handleChangeAplicacionDosis,
    handleChangeSelectValue,
  } = useControllerAplicaciones();

  const [isSubmitSuccessful, setIsSubmitSuccessful] = useState<
    boolean | undefined
  >(undefined);

  const onInvalidSubmit = (errors: any) => {
    if (errors?.fecha)
      toast.error(errors.fecha.message, {
        position: 'top-center',
      });
    else if (errors?.detalle) {
      if (errors?.detalle?.hectareas)
        toast.error(errors?.detalle?.hectareas?.message, {
          position: 'top-center',
        });
      else if (errors?.detalle?.cultivo?.id)
        toast.error(errors.detalle.cultivo.id.message, {
          position: 'top-center',
        });
      else if (errors?.detalle?.tratamiento?.id)
        toast.error(errors.detalle.tratamiento.id.message, {
          position: 'top-center',
        });
    }
  };
  const onSubmit = async (values: Pulverizacion) => {
    if (selectedLotes.length === 0) {
      toast.error('No hay lotes seleccionados.', {
        position: 'top-center',
      });
      return;
    }
    if (areEmptySelectedProducts) {
      toast.error('Hay productos incompletos.', {
        position: 'top-center',
      });

      return;
    }
    try {
      const PAYLOAD: Pulverizacion = {
        ...values,
        fecha: (values.fecha as Date).toISOString(),
        detalle: {
          campo: undefined,
          cultivo: undefined,
          tratamiento: undefined,
          id: undefined,
          campo_id: values.detalle.campo?.id as UUID,
          cultivo_id: values.detalle.cultivo?.id as UUID,
          tratamiento_id: values.detalle.tratamiento?.id as UUID,
          lotes: selectedLotes,
        },
        productos: aplicaciones,
      };

      const access_token = Cookies.get('access_token');
      if (!access_token) {
        toast.error('La sesión ha expirado', { position: 'top-center' });
        push('/');

        return;
      }

      await addPulverizacion(PAYLOAD, access_token);
      await revalidate('pulverizaciones');

      setIsSubmitSuccessful(true);
      setTimeout(() => handleOpen(), 1000);
    } catch (error) {
      if (error instanceof Error) toast.error(error.message);
    }
  };

  if (loading)
    return (
      <div className='grid place-items-center py-6'>
        <ReloadIcon className='size-6 animate-spin' />
      </div>
    );

  if (error)
    return (
      <p className='pb-4 text-center text-sm'>
        Se produjo un error al obtener los datos del servidor
      </p>
    );

  return (
    <form
      onSubmit={handleSubmit(onSubmit, onInvalidSubmit)}
      className='grid grid-cols-10 gap-4 px-4'
      id='form-add-pulverizacion'
    >
      <Popover open={calendarDialog.open} onOpenChange={calendarDialog.setOpen}>
        <PopoverTrigger asChild>
          <Button
            type='button'
            variant={'outline'}
            className='col-span-full justify-between font-normal'
          >
            {(watch('fecha') as Date)?.toLocaleDateString('es-AR') ?? (
              <>
                <p>Seleccione una fecha</p>
                <ChevronDown />
              </>
            )}
          </Button>
        </PopoverTrigger>
        <Controller
          control={control}
          name='fecha'
          rules={{
            required: {
              value: true,
              message: 'La fecha es requerida.',
            },
          }}
          render={({ field }) => (
            <PopoverContent
              className='mt-2 w-auto p-0'
              align='start'
              side='bottom'
            >
              <Calendar
                mode='single'
                selected={field.value as Date}
                onSelect={field.onChange}
                onDayClick={calendarDialog.handleOpen}
                initialFocus={false}
              />
            </PopoverContent>
          )}
        />
      </Popover>
      <Controller
        control={control}
        name='detalle.campo.id'
        render={({ field }) => (
          <Select
            onValueChange={(value) => {
              field.onChange(value);
              setSelectedCampo(campos?.find((campo) => campo.id === value));
              setSelectedLotes([]);
            }}
            {...field}
          >
            <SelectTrigger className='col-span-6'>
              <SelectValue placeholder='Ubicación' />
            </SelectTrigger>
            <SelectContent className='col-span-6'>
              {campos?.map((campo) => {
                const totalHectareas = campo.Lote?.reduce(
                  (acc, lote) => acc + (lote?.hectareas as number),
                  0,
                );
                return (
                  <SelectItem key={campo.id} value={campo.id as string}>
                    {campo.nombre} ({totalHectareas}ha)
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        )}
      />
      <AddOrEditCampoDialog className='col-span-4' />
      {selectedCampo && (
        <>
          <Label className='col-span-full flex items-center justify-between'>
            Seleccione los lotes a pulverizar
          </Label>
          <ul className='col-span-full flex flex-wrap items-center gap-2'>
            {(selectedCampo.Lote as Lote[]).map((lote) => (
              <LoteItem
                key={`badge-${lote.nombre}`}
                lote={lote}
                onClick={() => {
                  if (!selectedLotes.includes(lote.nombre as string))
                    setSelectedLotes((prev) => [
                      ...prev,
                      lote.nombre as string,
                    ]);
                  else
                    setSelectedLotes((prev) => [
                      ...prev.filter((selected) => selected !== lote.nombre),
                    ]);
                }}
                customStyle={{
                  backgroundColor: selectedLotes.includes(lote.nombre as string)
                    ? '#059f0050'
                    : `${lote.color as string}50`,
                  borderColor: selectedLotes.includes(lote.nombre as string)
                    ? '#059f00'
                    : (lote.color as string),
                }}
              />
            ))}
          </ul>
          <Map
            selectedCampo={selectedCampo}
            lotes={selectedCampo.Lote as Lote[]}
            className='col-span-full'
            size='!h-[20vh]'
            customCenter
            customZoom={15}
          />
        </>
      )}
      <Controller
        control={control}
        name='detalle.cultivo.id'
        rules={{
          required: { value: true, message: 'El cultivo es requerido.' },
        }}
        render={({ field }) => (
          <Select onValueChange={field.onChange} {...field}>
            <SelectTrigger className='col-span-4'>
              <SelectValue placeholder='Cultivo' />
            </SelectTrigger>
            <SelectContent className='col-span-4'>
              {cultivos?.map((cultivo) => {
                return (
                  <SelectItem key={cultivo.id} value={cultivo.id as string}>
                    {cultivo.nombre}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        )}
      />
      <Controller
        control={control}
        name='detalle.tratamiento.id'
        rules={{
          required: { value: true, message: 'El tratamiento es requerido.' },
        }}
        render={({ field }) => (
          <Select onValueChange={field.onChange} {...field}>
            <SelectTrigger className='col-span-6'>
              <SelectValue placeholder='Tipo de tratamiento' />
            </SelectTrigger>
            <SelectContent className='col-span-6'>
              {tratamientos?.map((tratamiento) => {
                return (
                  <SelectItem
                    key={tratamiento.id}
                    value={tratamiento.id as string}
                  >
                    {tratamiento.nombre}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        )}
      />
      <div className='col-span-full space-y-4'>
        <div className='flex w-full items-center justify-between'>
          <Label>Productos</Label>
          <aside className='flex items-center gap-2'>
            <Button
              type='button'
              variant={'outline'}
              size={'icon'}
              onClick={addAplicacion}
            >
              <PackagePlus />
            </Button>
            <Button
              type='button'
              variant={'destructive'}
              size={'icon'}
              disabled={aplicaciones.length === 1}
              onClick={deleteAplicacion}
            >
              <PackageMinus />
            </Button>
          </aside>
        </div>
        <ul className='max-h-48 space-y-4 overflow-auto'>
          {aplicaciones.map((aplicacion, index) => (
            <li key={`aplicacion-${index}`} className='grid grid-cols-10 gap-4'>
              <Select
                onValueChange={(value) => handleChangeSelectValue(value, index)}
              >
                <SelectTrigger className='col-span-5'>
                  <SelectValue placeholder='Producto' />
                </SelectTrigger>
                <SelectContent className='col-span-5'>
                  {productos?.map((producto) => {
                    return (
                      <SelectItem
                        key={producto.id}
                        value={producto.id as string}
                      >
                        {producto.nombre}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <Input
                placeholder='Dosis'
                className='col-span-3 text-sm'
                onChange={(e) =>
                  handleChangeAplicacionDosis(
                    Number(e.target.value),
                    aplicacion.producto_id,
                  )
                }
              />
              <span className='col-span-2 self-center text-sm font-semibold opacity-60'>
                {productos?.find(
                  (producto) => producto.id === aplicacion.producto_id,
                )?.unidad === UNIDAD.LITROS.toUpperCase()
                  ? 'L/Ha'
                  : 'g/Ha'}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <Button
        disabled={isSubmitting || isSubmitSuccessful}
        type='submit'
        className={cn(
          'col-span-full disabled:opacity-100',
          isSubmitSuccessful && 'bg-green-700',
        )}
        form='form-add-pulverizacion'
      >
        {isSubmitSuccessful ? (
          <>
            Completado <Check />
          </>
        ) : !isSubmitting ? (
          <>Crear</>
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
