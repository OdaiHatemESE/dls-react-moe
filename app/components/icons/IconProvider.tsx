"use client";

import React from 'react';
import { IconContext } from '@phosphor-icons/react';

type Props = {
  children: React.ReactNode;
};

export default function IconProvider({ children }: Props) {
  return (
    <IconContext.Provider value={{ size: 20, weight: 'regular' }}>
      {children}
    </IconContext.Provider>
  );
}
