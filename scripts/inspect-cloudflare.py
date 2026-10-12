"""Read-only account preflight; use secure environment bindings, never token arguments.

Results contain selected account/subdomain/plan metadata, not raw API responses.
No resource creation, billing change, source upload or deployment is performed.
"""
import argparse,json,os,pathlib,re,ssl,sys,urllib.error,urllib.request

ROOT=pathlib.Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--account',default=os.environ.get('CLOUDFLARE_ACCOUNT_ID',''),help='Non-secret 32-character Cloudflare Account ID')
args=parser.parse_args()
if args.account and not re.fullmatch(r'[a-fA-F0-9]{32}',args.account):
 parser.error('Account ID must contain exactly 32 hexadecimal characters.')
token=os.environ.get('CLOUDFLARE_API_TOKEN')
if not token:
 print('Cloudflare inspection unavailable: CLOUDFLARE_API_TOKEN is not bound in this runtime. Use the connected plugin when available or enter the token through secure environment settings.')
 sys.exit(2)

class NoRedirect(urllib.request.HTTPRedirectHandler):
 def redirect_request(self,*_args,**_kwargs):return None

# The supported environment proxy and default trusted CA remain active.
opener=urllib.request.build_opener(urllib.request.ProxyHandler(),urllib.request.HTTPSHandler(context=ssl.create_default_context()),NoRedirect())
def read(path):
 request=urllib.request.Request('https://api.cloudflare.com/client/v4'+path,headers={'Authorization':'Bearer '+token,'Accept':'application/json'},method='GET')
 try:
  with opener.open(request,timeout=20) as response:
   raw=response.read(1_048_577)
   if len(raw)>1_048_576:return {'status':'response_too_large'}
   value=json.loads(raw)
   if value.get('success') is not True:return {'status':'api_rejected','codes':[e.get('code') for e in value.get('errors',[]) if isinstance(e,dict)]}
   return {'status':'readable','result':value.get('result')}
 except urllib.error.HTTPError as error:return {'status':'http_rejected','http_status':error.code}
 except (urllib.error.URLError,TimeoutError,OSError):return {'status':'network_or_tls_unavailable'}
 except (ValueError,TypeError):return {'status':'invalid_response'}

accounts=read('/accounts?per_page=50&page=1')
report={'scope':'Read-only Cloudflare metadata; no billing eligibility, hard spending cap, live application or device qualification.',
 'accounts_status':accounts['status'],'accounts':[],
 'release_gates':['Owner must verify current plan, allowances and overage protections in the dashboard; readable APIs do not establish $0 entitlement.','Google OAuth application settings and private runtime secrets are separate from the Cloudflare management connection.','App publication and resource provisioning remain separate authorized actions.']}
if isinstance(accounts.get('result'),list):report['accounts']=[{'id':a.get('id'),'name':str(a.get('name',''))[:120]} for a in accounts['result'] if isinstance(a,dict)]
account=args.account
if not account and len(report['accounts'])==1:account=report['accounts'][0]['id']
if account and re.fullmatch(r'[a-fA-F0-9]{32}',str(account)):
 report['selected_account_id']=account
 for kind,path in [('pages','/pages/projects?per_page=50&page=1'),('workers','/workers/subdomain'),('subscriptions','/subscriptions'),('d1','/d1/database?per_page=50&page=1'),('r2','/r2/buckets?per_page=50')]:
  response=read('/accounts/'+account+path);result=response.get('result');entry={k:v for k,v in response.items() if k!='result'}
  if kind=='pages' and isinstance(result,list):entry['projects']=[{'name':str(item.get('name',''))[:120],'subdomain':str(item.get('subdomain',''))[:250],'production_branch':str(item.get('production_branch',''))[:120],'source_type':(item.get('source') or {}).get('type')} for item in result if isinstance(item,dict)]
  elif kind=='workers' and isinstance(result,dict):entry['subdomain']=result.get('subdomain')
  elif kind=='subscriptions' and isinstance(result,list):entry['plans']=[{'name':str((item.get('rate_plan') or {}).get('public_name',''))[:120],'id':(item.get('rate_plan') or {}).get('id')} for item in result if isinstance(item,dict)]
  elif kind=='d1' and isinstance(result,list):entry['listed_database_count']=len(result)
  elif kind=='r2' and isinstance(result,dict) and isinstance(result.get('buckets'),list):entry['listed_bucket_count']=len(result['buckets'])
  report[kind]=entry
else:report['selection_status']='Choose an account explicitly; the returned page is not a complete account inventory.'
destination=ROOT/'.sites-runtime/cloudflare-account-preflight.json';destination.parent.mkdir(exist_ok=True)
destination.write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
if accounts['status']!='readable':sys.exit(2)
