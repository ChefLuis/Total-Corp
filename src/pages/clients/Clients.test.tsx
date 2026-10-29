// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthContext';
import { RBACProvider } from '../../context/RBACContext';
import ClientsPage from './Clients';
import '../../i18n';

const mount = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter>
        <AuthProvider><RBACProvider><ClientsPage /></RBACProvider></AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );

describe('Tela de Clientes (fluxo real de cadastro)', () => {
  it('valida, cadastra e busca um cliente', async () => {
    const user = userEvent.setup();
    mount();
    await screen.findByText(/Helena Ribeiro Castro/i);

    await user.click(screen.getAllByRole('button', { name: /Novo Cliente/i })[0]);
    const dialog = await screen.findByRole('dialog');

    // validação: sem telefone válido
    await user.type(screen.getByLabelText(/Nome completo/i), 'Marina Teste');
    await user.click(screen.getByRole('button', { name: /Cadastrar cliente/i }));
    expect((await screen.findByRole('alert')).textContent).toMatch(/telefone/i);

    // validação: sem aceite LGPD
    await user.type(screen.getByLabelText(/Telefone/i), '41987654321');
    await user.click(screen.getByRole('button', { name: /Cadastrar cliente/i }));
    expect((await screen.findByRole('alert')).textContent).toMatch(/LGPD/i);

    // sucesso
    await user.click(screen.getByRole('checkbox', { name: /autorizou/i }));
    await user.click(screen.getByRole('button', { name: /Cadastrar cliente/i }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(await screen.findByText('Marina Teste')).toBeTruthy();
    expect(screen.getByText('(41) 98765-4321')).toBeTruthy();

    // busca por telefone
    await user.type(screen.getByLabelText(/Buscar cliente/i), '98765');
    expect(screen.queryByText(/Helena Ribeiro Castro/i)).toBeNull();
    expect(screen.getByText('Marina Teste')).toBeTruthy();
    expect(dialog).toBeTruthy();
    cleanup();
  });
});
