'use client';

import { AddOrEditCampoDialog, DeleteCampoDialog } from './campos-dialog';
import { Campo, Lote } from '@/types/campos.types';
import { Card, CardContent } from './ui/card';

import { Badge } from './ui/badge';
import Map from './map';
import { UUID } from 'crypto';

interface Props {
  data: Campo;
}

export default function CampoItem({ data }: Props) {
  return (
    <li className='flex items-start justify-between'>
      <Card className='hover:bg-sidebar-accent w-full duration-200 ease-in-out'>
        <CardContent className='space-y-4'>
          <div className='flex items-start justify-between pt-6'>
            <div className='space-y-1'>
              <h3 className='text-base font-semibold'>{data.nombre}</h3>
              <Badge variant={'secondary'}>{data.hectareas}ha</Badge>
            </div>
            <aside className='producto-settings space-x-4'>
              <AddOrEditCampoDialog isEdit data={data} />
              <DeleteCampoDialog id={data.id as UUID} />
            </aside>
          </div>
          <Map lotes={data.Lote as Lote[]} size='!h-[25dvh]' customCenter />
        </CardContent>
      </Card>
    </li>
  );
}
