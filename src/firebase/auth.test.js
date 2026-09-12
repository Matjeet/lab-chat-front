import {
  createUserWithEmailAndPassword,
  deleteUser,
  updateProfile,
} from 'firebase/auth';

import { crearUsuarioFirebase, borrarUsuarioFirebase } from './auth';
import { obtenerAuth } from './client';

jest.mock('firebase/auth');
jest.mock('./client');

const authFake = {};

beforeEach(() => {
  jest.clearAllMocks();
  obtenerAuth.mockReturnValue(authFake);
});

describe('crearUsuarioFirebase', () => {
  it('crea el usuario con email y password, y le pone el username', async () => {
    const user = { uid: 'abc123' };
    createUserWithEmailAndPassword.mockResolvedValue({ user });
    updateProfile.mockResolvedValue(undefined);

    const resultado = await crearUsuarioFirebase({
      email: 'mateo@example.com',
      password: 'Passw0rd!',
      username: 'mateo29',
    });

    expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
      authFake,
      'mateo@example.com',
      'Passw0rd!',
    );
    expect(updateProfile).toHaveBeenCalledWith(user, { displayName: 'mateo29' });
    expect(resultado).toBe(user);
  });

  it('no revienta el alta si falla poner el displayName', async () => {
    const user = { uid: 'abc123' };
    createUserWithEmailAndPassword.mockResolvedValue({ user });
    updateProfile.mockRejectedValue(new Error('fallo al fijar el nombre'));

    await expect(
      crearUsuarioFirebase({ email: 'a@b.com', password: 'x', username: 'a' }),
    ).resolves.toBe(user);
  });

  it('propaga el error si Firebase rechaza la creación', async () => {
    const error = Object.assign(new Error('email en uso'), {
      code: 'auth/email-already-in-use',
    });
    createUserWithEmailAndPassword.mockRejectedValue(error);

    await expect(
      crearUsuarioFirebase({ email: 'a@b.com', password: 'x', username: 'a' }),
    ).rejects.toBe(error);
  });
});

describe('borrarUsuarioFirebase', () => {
  it('llama a deleteUser con el usuario dado', async () => {
    const user = { uid: 'abc123' };
    deleteUser.mockResolvedValue(undefined);

    await borrarUsuarioFirebase(user);

    expect(deleteUser).toHaveBeenCalledWith(user);
  });
});
