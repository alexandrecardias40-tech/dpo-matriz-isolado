import pandas as pd
import re
import json
import glob
import os
import datetime

def parse_num(val):
    if pd.isna(val) or val == '' or val == '-': return 0.0
    if isinstance(val, str):
        val = val.replace('R$', '').replace('\u00a0', '').strip()
        if not val: return 0.0
        val = val.replace('.', '')
        val = val.replace(',', '.')
        try:
            val = float(val)
        except ValueError:
            return 0.0
    else:
        val = float(val)
    return round(val, 2)

def clean_nan(obj):
    if isinstance(obj, float) and (obj != obj): return None
    if isinstance(obj, dict): return {k: clean_nan(v) for k, v in obj.items()}
    if isinstance(obj, list): return [clean_nan(i) for i in obj]
    return obj

# ═══════════════════════════════════════════════════════════════
# 1. Localizar arquivos fonte via glob
# ═══════════════════════════════════════════════════════════════
import os
base_dir = os.path.dirname(os.path.abspath(__file__))
f_matriz_list = glob.glob(os.path.join(base_dir, 'Matriz Unidades*.xlsx'))
f_tg_list = glob.glob(os.path.join(base_dir, 'Tesouro Gerencial Matriz*.xlsx'))

if not f_matriz_list:
    raise FileNotFoundError("Arquivo 'Matriz Unidades Execução.xlsx' não encontrado.")
if not f_tg_list:
    raise FileNotFoundError("Arquivo 'Tesouro Gerencial Matriz.xlsx' não encontrado.")

f_matriz = f_matriz_list[0]
f_tg = f_tg_list[0]

print(f"Lendo Planilha Matriz: {f_matriz}")
print(f"Lendo Tesouro Gerencial Matriz: {f_tg}")

# ═══════════════════════════════════════════════════════════════
# 2. Carregar e Processar Planilha de Execução Matriz
# ═══════════════════════════════════════════════════════════════
df_mat = pd.read_excel(f_matriz, sheet_name='Execução Matriz Unidades')
df_mat.columns = [c.strip() for c in df_mat.columns]
df_mat = df_mat.dropna(subset=['UGR', 'Plano Interno'])

df_mat['UGR_clean'] = df_mat['UGR'].astype(str).str.strip()
df_mat['PI_clean'] = df_mat['Plano Interno'].astype(str).str.strip()

# ═══════════════════════════════════════════════════════════════
# 3. Carregar e Processar Tesouro Gerencial
# ═══════════════════════════════════════════════════════════════
# Ler a planilha sem pular linhas para detectar o cabeçalho correto
df_tg_raw = pd.read_excel(f_tg, header=None)

# Detectar a linha do cabeçalho principal (contém 'UG Responsável')
hdr_main_row = None
hdr_sub_row = None
for i, row in df_tg_raw.iterrows():
    if any(str(v).strip() == 'UG Responsável' for v in row.values):
        hdr_main_row = i
    if any(str(v).strip() == 'CREDITO DISPONIVEL' for v in row.values):
        hdr_sub_row = i
        break

if hdr_main_row is None:
    raise ValueError("Não encontrei cabeçalho 'UG Responsável' na planilha TG.")

print(f"Cabeçalho principal na linha {hdr_main_row}, sub-cabeçalho na linha {hdr_sub_row}")

# Montar mapeamento de colunas combinando main+sub cabeçalhos
skip = (hdr_sub_row + 1) if hdr_sub_row is not None else (hdr_main_row + 1)
df_tg = pd.read_excel(f_tg, skiprows=skip, header=None)

# Usar o sub-cabeçalho para nomear colunas
if hdr_sub_row is not None:
    sub_names = list(df_tg_raw.iloc[hdr_sub_row])
    main_names = list(df_tg_raw.iloc[hdr_main_row])
    # Construir nomes finais: priorizar sub-cabeçalho; fallback para main
    col_names = []
    for i, (m, s) in enumerate(zip(main_names, sub_names)):
        m_str = str(m).strip() if pd.notna(m) else ''
        s_str = str(s).strip() if pd.notna(s) else ''
        if s_str and s_str not in ('nan', 'None'):
            col_names.append(s_str)
        elif m_str and m_str not in ('nan', 'None'):
            col_names.append(m_str)
        else:
            col_names.append(f'col_{i}')
    # Garantir nomes únicos
    seen = {}
    unique_names = []
    for name in col_names:
        if name in seen:
            seen[name] += 1
            unique_names.append(f'{name}_{seen[name]}')
        else:
            seen[name] = 0
            unique_names.append(name)
    # Ajustar tamanho se diferente
    while len(unique_names) < len(df_tg.columns):
        unique_names.append(f'col_{len(unique_names)}')
    df_tg.columns = unique_names[:len(df_tg.columns)]
else:
    df_tg.columns = [str(c).strip() if pd.notna(c) else f'col_{i}' for i, c in enumerate(df_tg_raw.iloc[hdr_main_row])]

print("Colunas TG detectadas:", list(df_tg.columns))

# Renomear colunas esperadas para padronizar
col_map = {
    'UG Responsável': 'UG Responsável',
    'PI': 'PI',
    'Item Informação': 'Item Informação',
    'CREDITO DISPONIVEL': 'CREDITO DISPONIVEL',
    'DESPESAS EMPENHADAS': 'DESPESAS EMPENHADAS',
    'DESPESAS EMPENHADAS A LIQUIDAR': 'DESPESAS EMPENHADAS A LIQUIDAR',
    'DESPESAS LIQUIDADAS': 'DESPESAS LIQUIDADAS',
    'Total': 'Total',
}
# Aplicar limpeza de nomes de colunas
df_tg.columns = [c.strip() if isinstance(c, str) else f'col_{i}' for i, c in enumerate(df_tg.columns)]
df_tg = df_tg.dropna(subset=['UG Responsável', 'PI'])
# Filtrar linhas de Total do Tesouro Gerencial
df_tg = df_tg[df_tg['UG Responsável'].astype(str).str.strip().str.upper() != 'TOTAL']

df_tg['UGR_clean'] = df_tg['UG Responsável'].astype(str).str.strip()
df_tg['PI_clean'] = df_tg['PI'].astype(str).str.strip()

# Filtrar PIs e UGRs que contenham '-8'
df_tg = df_tg[~df_tg['PI_clean'].str.contains('-8', na=False)]
df_mat = df_mat[~df_mat['PI_clean'].str.contains('-8', na=False)]
df_tg = df_tg[~df_tg['UGR_clean'].str.contains('-8', na=False)]
df_mat = df_mat[~df_mat['UGR_clean'].str.contains('-8', na=False)]

# Carregar também Adiantamentos (se existirem, para guardar ou expor no painel)
try:
    df_adiantamentos = pd.read_excel(f_matriz, sheet_name='Adiantamentos realizados')
    df_adiantamentos = df_adiantamentos.dropna(subset=['Unidade', 'Valor'])
    adiantamentos_list = []
    for _, row in df_adiantamentos.iterrows():
        dt_val = row.get('Data', '')
        if isinstance(dt_val, pd.Timestamp):
            dt_str = dt_val.strftime('%d/%m/%Y')
        else:
            dt_str = str(dt_val).split(' ')[0] if pd.notna(dt_val) else ''
        
        adiantamentos_list.append({
            'data': dt_str,
            'unidade': str(row.get('Unidade', '')).strip(),
            'valor': parse_num(row.get('Valor', 0)),
            'sei': str(row.get('SEI', '')).strip()
        })
except Exception as e:
    print(f"Aviso ao ler adiantamentos: {e}")
    adiantamentos_list = []

# ═══════════════════════════════════════════════════════════════
# 4. Cruzamento dos Dados (Chaves do Tesouro Gerencial)
# ═══════════════════════════════════════════════════════════════
keys_mat = set(zip(df_mat['UGR_clean'], df_mat['PI_clean']))
keys_tg = set(zip(df_tg['UGR_clean'], df_tg['PI_clean']))
all_keys = keys_tg

records = []
for ugr, pi in all_keys:
    row_mat = df_mat[(df_mat['UGR_clean'] == ugr) & (df_mat['PI_clean'] == pi)]
    rows_tg = df_tg[(df_tg['UGR_clean'] == ugr) & (df_tg['PI_clean'] == pi)]
    
    in_matrix = not row_mat.empty
    in_tg = not rows_tg.empty
    
    unidade = ''
    sei = ''
    nome_responsavel = ''
    nc_alocacao = ''
    nc_desconto = ''
    pi_nome = ''
    
    valor_aprovado = 0.0
    credito_disponivel_matriz = 0.0
    despesas_empenhadas_matriz = 0.0
    despesas_debitadas_matriz = 0.0
    total_executado_matriz = 0.0
    percentual_executado_matriz = 0.0
    debitar_matriz = 0.0
    
    if in_matrix:
        r = row_mat.iloc[0]
        unidade = str(r.get('Unidade', '')).strip()
        sei = str(r.get('SEI', '')).strip()
        nome_responsavel = str(r.get('Nome', '')).strip()
        nc_alocacao = str(r.get('NC Alocação', '')).strip()
        nc_desconto = str(r.get('NC desconto', '')).strip()
        
        valor_aprovado = parse_num(r.get('VALOR APROVADO', 0))
        credito_disponivel_matriz = parse_num(r.get('Crédito Disponível', 0))
        despesas_empenhadas_matriz = parse_num(r.get('Despesas empenhadas', 0))
        
        # Fórmulas solicitadas:
        # Despesas debitadas = VALOR APROVADO - Crédito Disponível - Despesas empenhadas
        despesas_debitadas_matriz = round(valor_aprovado - credito_disponivel_matriz - despesas_empenhadas_matriz, 2)
        # Total Executado = Despesas empenhadas + Despesas debitadas
        total_executado_matriz = round(despesas_empenhadas_matriz + despesas_debitadas_matriz, 2)
        # Percentual executado = Total Executado / VALOR APROVADO
        percentual_executado_matriz = round(total_executado_matriz / valor_aprovado, 6) if valor_aprovado > 0 else 0.0
        
        debitar_matriz = parse_num(r.get('Debitar', 0))
        
    credito_disponivel_tg = 0.0
    despesas_empenhadas_tg = 0.0
    despesas_empenhadas_a_liquidar_tg = 0.0
    despesas_liquidadas_tg = 0.0
    total_tg = 0.0
    tg_breakdown = []
    
    if in_tg:
        if not unidade:
            # Pega o nome da unidade do Tesouro Gerencial (coluna 1)
            unidade = str(rows_tg.iloc[0].iloc[1]).strip()
        pi_nome = str(rows_tg.iloc[0].iloc[3]).strip() # Nome do PI (coluna 3)
        
        for _, r in rows_tg.iterrows():
            item_nd = str(r.get('Item Informação', '')).strip()
            nd_nome = str(r.iloc[5]).strip() # Descrição da Natureza (coluna 5)
            
            val_cred = parse_num(r.get('CREDITO DISPONIVEL', 0))
            val_emp = parse_num(r.get('DESPESAS EMPENHADAS', 0))
            val_emp_liq = parse_num(r.get('DESPESAS EMPENHADAS A LIQUIDAR', 0))
            val_liq = parse_num(r.get('DESPESAS LIQUIDADAS', 0))
            val_tot = parse_num(r.get('Total', 0))
            
            credito_disponivel_tg += val_cred
            despesas_empenhadas_tg += val_emp
            despesas_empenhadas_a_liquidar_tg += val_emp_liq
            despesas_liquidadas_tg += val_liq
            total_tg += val_tot
            
            tg_breakdown.append({
                'natureza_despesa': item_nd,
                'natureza_despesa_nome': nd_nome,
                'credito_disponivel': val_cred,
                'despesas_empenhadas': val_emp,
                'despesas_empenhadas_a_liquidar': val_emp_liq,
                'despesas_liquidadas': val_liq,
                'total': val_tot
            })

    # Determinar status/semaforo de cruzamento/execução para o visual
    # Verde: se bate o empenhado da matriz com o empenhado do TG
    # Amarelo: se há pequenas divergências
    # Vermelho: se não há correspondência
    diff_emp = abs(despesas_empenhadas_matriz - despesas_empenhadas_tg)
    if in_matrix and in_tg:
        if diff_emp < 1.0:
            semaforo = 'verde'
        elif diff_emp < 1000.0:
            semaforo = 'amarelo'
        else:
            semaforo = 'vermelho'
    elif in_matrix:
        # Só na matriz
        semaforo = 'matriz_only'
    else:
        # Só no TG
        semaforo = 'tg_only'

    records.append({
        'ugr': ugr,
        'unidade': unidade,
        'plano_interno': pi,
        'plano_interno_nome': pi_nome,
        'sei': sei,
        'nome_responsavel': nome_responsavel,
        'nc_alocacao': nc_alocacao,
        'nc_desconto': nc_desconto,
        'valor_aprovado': valor_aprovado,
        'credito_disponivel_matriz': credito_disponivel_matriz,
        'despesas_empenhadas_matriz': despesas_empenhadas_matriz,
        'despesas_debitadas_matriz': despesas_debitadas_matriz,
        'total_executado_matriz': total_executado_matriz,
        'percentual_executado_matriz': percentual_executado_matriz,
        'debitar_matriz': debitar_matriz,
        'credito_disponivel_tg': round(credito_disponivel_tg, 2),
        'despesas_empenhadas_tg': round(despesas_empenhadas_tg, 2),
        'despesas_empenhadas_a_liquidar_tg': round(despesas_empenhadas_a_liquidar_tg, 2),
        'despesas_liquidadas_tg': round(despesas_liquidadas_tg, 2),
        'total_tg': round(total_tg, 2),
        'in_matrix': in_matrix,
        'in_tg': in_tg,
        'semaforo': semaforo,
        'tg_breakdown': tg_breakdown
    })

# Formatar registros finais limpos
records_clean = clean_nan(records)

# Guardar no dashboard
output_data = {
    'records': records_clean,
    'adiantamentos': clean_nan(adiantamentos_list)
}

public_dir = os.path.join(base_dir, '..', 'public')
src_dir = os.path.join(base_dir, '..', 'src')
os.makedirs(public_dir, exist_ok=True)

with open(os.path.join(public_dir, 'data.json'), 'w', encoding='utf-8') as f:
    json.dump(output_data, f, ensure_ascii=False, indent=2)

print(f"Salvo data.json com {len(records_clean)} registros de Matriz e {len(adiantamentos_list)} adiantamentos.")

# ═══════════════════════════════════════════════════════════════
# 5. Salvar metadados de atualização
# ═══════════════════════════════════════════════════════════════
import datetime
latest_time = max(os.path.getmtime(f_matriz), os.path.getmtime(f_tg))
# Ajuste de fuso horário para o Brasil (UTC-3) pois o GitHub Actions roda em UTC (GMT+0)
dt_utc = datetime.datetime.fromtimestamp(latest_time, tz=datetime.timezone.utc)
dt_br = dt_utc - datetime.timedelta(hours=3)
dt = dt_br.strftime('%d/%m/%Y às %H:%M')

meta = {
    "lastUpdated": dt,
    "filename": f"{os.path.basename(f_matriz)} / {os.path.basename(f_tg)}"
}

with open(os.path.join(public_dir, 'metadata.json'), 'w', encoding='utf-8') as f:
    json.dump(meta, f, ensure_ascii=False, indent=2)
with open(os.path.join(src_dir, 'metadata.json'), 'w', encoding='utf-8') as f:
    json.dump(meta, f, ensure_ascii=False, indent=2)

print(f"Salvo metadata.json com data de atualização: {dt}")
