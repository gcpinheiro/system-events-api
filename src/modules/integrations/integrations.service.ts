import { Injectable } from '@nestjs/common';

export type InstitutionalStudent = {
  studentId: string;
  name: string;
  email: string;
};

@Injectable()
export class IntegrationsService {
  async validateToken(token: string): Promise<InstitutionalStudent | null> {
    // MOCK: validação “fake” só para destravar o fluxo
    if (!token || token.trim().length < 10) return null;

    return {
      studentId: '202012345',
      name: 'Aluno Exemplo',
      email: 'aluno@fariasbrito.com.br',
    };
  }
}
