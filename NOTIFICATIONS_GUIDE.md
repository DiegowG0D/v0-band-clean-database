# Band Clean Notification System

Sistema completo de notificações in-app com Supabase Realtime implementado no Band Clean.

## Características

- **Notificações em tempo real** usando Supabase Realtime
- **Badge de contagem** mostrando notificações não lidas
- **Notificações do navegador** (Web Notifications API)
- **Três tipos de eventos automatizados**:
  - Cleaner recebe notificação quando atribuído a um booking
  - Admin recebe notificação quando cleaner faz clock in
  - Admin recebe notificação quando cleaner faz clock out
- **Interface responsiva** com dropdown elegante
- **Ações disponíveis**: marcar como lida, marcar todas como lidas, deletar

## Setup

### 1. Executar o Script SQL

Execute o script `scripts/022_create_notifications_table.sql` no Supabase SQL Editor para:
- Criar a tabela `notifications`
- Configurar RLS policies
- Criar triggers automáticos para eventos de booking e attendance
- Habilitar Realtime na tabela

### 2. Habilitar Realtime no Supabase Dashboard

1. Acesse o Supabase Dashboard
2. Vá em **Database** > **Replication**
3. Certifique-se que a tabela `notifications` está habilitada para Realtime

## Componentes

### NotificationBell
Sino de notificações com badge de contagem exibido no header.

**Localização**: Já integrado em:
- Admin Sidebar (desktop)
- Cleaner Sidebar (desktop)  
- Mobile Navigation (mobile)

### NotificationList
Lista de notificações com scroll, filtros e ações.

## Como Usar

### Listar Notificações (automático)
As notificações aparecem automaticamente quando:
- Admin atribui um cleaner a um booking
- Cleaner faz clock in/out para um cliente

### Criar Notificações Manualmente (via SQL)
\`\`\`sql
SELECT create_notification(
  'user-id-uuid',
  'Título da Notificação',
  'Mensagem detalhada aqui',
  'info', -- tipo: booking_assigned, clock_in, clock_out, booking_reminder, info
  'related-id-uuid' -- opcional: ID do booking, attendance, etc
);
\`\`\`

### Usar o Hook em Componentes Customizados
\`\`\`typescript
import { useNotifications } from '@/lib/hooks/use-notifications';

function MyComponent() {
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead,
    deleteNotification 
  } = useNotifications();

  // Seus componentes aqui
}
\`\`\`

## Tipos de Notificações

| Tipo | Descrição | Ícone |
|------|-----------|-------|
| `booking_assigned` | Cleaner atribuído a tarefa | Calendar |
| `clock_in` | Cleaner iniciou trabalho | Clock (verde) |
| `clock_out` | Cleaner finalizou trabalho | Clock (laranja) |
| `booking_reminder` | Lembrete de booking próximo | Bell |
| `info` | Informação geral | Bell |

## Notificações do Navegador

O sistema solicita permissão automaticamente para enviar notificações do navegador.

- **Chrome/Edge/Firefox**: Suportado
- **Safari**: Suportado (iOS 16.4+)
- **Permissão**: Solicitada no primeiro acesso

## Estrutura da Tabela

\`\`\`sql
notifications
├── id (uuid, primary key)
├── user_id (uuid, foreign key → users)
├── title (varchar)
├── message (text)
├── type (varchar)
├── related_id (uuid, nullable)
├── is_read (boolean)
├── created_at (timestamp)
└── updated_at (timestamp)
\`\`\`

## Triggers Automáticos

### 1. Booking Assignment
Quando um cleaner é atribuído a um booking (INSERT ou UPDATE), uma notificação é criada automaticamente para o cleaner.

### 2. Clock In/Out Events
Quando um cleaner faz clock in ou clock out, todos os admins recebem uma notificação automaticamente.

## Performance

- Notificações limitadas a **50 mais recentes** por usuário
- **Indexes** criados em `user_id`, `is_read` e `created_at`
- **Realtime** usa WebSocket para atualizações instantâneas sem polling

## Personalização

### Adicionar Novos Tipos de Notificações

1. Edite o tipo no SQL schema (enum ou varchar)
2. Crie trigger ou chame `create_notification()` no evento desejado
3. Adicione ícone correspondente em `notification-list.tsx`

### Exemplo: Notificar Lembrete de Booking
\`\`\`sql
-- Criar função para enviar lembretes 24h antes
CREATE OR REPLACE FUNCTION send_booking_reminders()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_booking RECORD;
BEGIN
  FOR v_booking IN
    SELECT b.id, b.cleaner_id, c.name, s.name as service_name, b.scheduled_date
    FROM bookings b
    JOIN customers c ON b.customer_id = c.id
    JOIN services s ON b.service_id = s.id
    WHERE b.scheduled_date = CURRENT_DATE + INTERVAL '1 day'
    AND b.cleaner_id IS NOT NULL
    AND b.status != 'cancelled'
  LOOP
    PERFORM create_notification(
      v_booking.cleaner_id,
      'Reminder: Task Tomorrow',
      'You have ' || v_booking.service_name || ' for ' || v_booking.name || ' tomorrow',
      'booking_reminder',
      v_booking.id
    );
  END LOOP;
END;
$$;
\`\`\`

## Troubleshooting

### Notificações não aparecem
1. Verifique se o script SQL foi executado
2. Confirme que Realtime está habilitado no Supabase
3. Verifique RLS policies (usuário deve ter permissão)
4. Abra o console do navegador para ver erros

### Badge não atualiza
- O componente usa Supabase Realtime
- Verifique conexão WebSocket no Network tab
- Certifique-se que não há bloqueadores de WebSocket

### Notificações do navegador não funcionam
- Verifique se o usuário deu permissão
- HTTPS é obrigatório (exceto localhost)
- Alguns navegadores bloqueiam em modo anônimo
