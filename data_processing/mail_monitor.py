import imaplib
import email
import os
import sys
import subprocess
from email.header import decode_header
from datetime import datetime

def log(msg):
    ts = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
    print(f"[MailMonitor {ts}] {msg}", flush=True)

def _get_decoded_filename(filename_raw):
    if not filename_raw:
        return None
    decoded_list = decode_header(filename_raw)
    decoded_name = ""
    for decoded_part, encoding in decoded_list:
        if isinstance(decoded_part, bytes):
            decoded_name += decoded_part.decode(encoding or "utf-8", errors="ignore")
        else:
            decoded_name += str(decoded_part)
    return decoded_name

def run():
    email_user = os.environ.get("EMAIL_USER")
    email_pass = os.environ.get("EMAIL_PASSWORD")

    if not email_user or not email_pass:
        log("Erro: Variáveis de ambiente EMAIL_USER e EMAIL_PASSWORD não configuradas.")
        sys.exit(1)

    log(f"Conectando ao IMAP para o e-mail: {email_user}")

    try:
        mail = imaplib.IMAP4_SSL("imap.gmail.com")
        mail.login(email_user, email_pass)
        mail.select("INBOX")
        
        # Busca e-mails não lidos
        status, messages = mail.search(None, 'UNSEEN')
        if status != "OK":
            log("Erro ao buscar e-mails.")
            return

        email_ids = messages[0].split()
        if not email_ids:
            log("Nenhum e-mail não lido encontrado.")
            return

        file_downloaded = False
        base_dir = os.path.dirname(os.path.abspath(__file__))
        
        for e_id in email_ids:
            res, msg_data = mail.fetch(e_id, '(RFC822)')
            if res != "OK":
                continue

            for response_part in msg_data:
                if isinstance(response_part, tuple):
                    msg = email.message_from_bytes(response_part[1])
                    subject = _get_decoded_filename(msg["Subject"])
                    log(f"Processando e-mail: '{subject}'")

                    if msg.is_multipart():
                        for part in msg.walk():
                            if part.get_content_maintype() == 'multipart':
                                continue
                            if part.get('Content-Disposition') is None:
                                continue
                                
                            filename = _get_decoded_filename(part.get_filename())
                            if filename and filename.lower().endswith('.xlsx'):
                                filepath = os.path.join(base_dir, "Tesouro Gerencial Matriz.xlsx")
                                with open(filepath, "wb") as f:
                                    f.write(part.get_payload(decode=True))
                                log(f"Anexo salvo: {filepath}")
                                file_downloaded = True
                                break
                    if file_downloaded:
                        break
            
            # Após processar, se encontrou anexo ou não, a flag SEEN já foi setada pelo fetch.
            # Vamos interromper no primeiro email válido encontrado
            if file_downloaded:
                break

        mail.close()
        mail.logout()

        if file_downloaded:
            log("Rodando build_data.py...")
            result = subprocess.run([sys.executable, os.path.join(base_dir, "build_data.py")], capture_output=True, text=True)
            log(f"Saída do build_data.py:\n{result.stdout}")
            if result.stderr:
                log(f"Erro do build_data.py:\n{result.stderr}")
        else:
            log("Nenhum anexo Excel encontrado nos e-mails não lidos.")

    except Exception as e:
        log(f"Erro na conexão IMAP: {e}")
        sys.exit(1)

if __name__ == "__main__":
    run()
