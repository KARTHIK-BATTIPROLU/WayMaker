import asyncio, httpx, json

async def full_test():
    async with httpx.AsyncClient(base_url='http://127.0.0.1:8000', timeout=10) as c:
        print('=== CHECKING ALL USERS & PROJECTS ===')
        
        for email, pwd in [('test@gmail.com', 'password123'), ('admin@waymaker.ai', 'Waymaker@123'), ('test@waymaker.ai', 'password123')]:
            r = await c.post('/api/auth/login', json={'email': email, 'password': pwd})
            print(f'\n{email}: status={r.status_code}')
            if r.status_code == 200:
                token = r.json()['access_token']
                headers = {'Authorization': f'Bearer {token}'}
                pr = await c.get('/api/projects', headers=headers)
                projects = pr.json()
                print(f'  Projects: {len(projects)}')
                for p in projects:
                    has_mr = bool(p.get('marketResearch'))
                    has_comp = len(p.get('competitors', []))
                    has_web = bool(p.get('websiteCode'))
                    has_mk = len(p.get('marketingKit', []))
                    has_fund = len(p.get('fundingOpportunities', []))
                    print(f'  [{p["id"]}] "{p["name"]}"')
                    print(f'    MarketResearch={has_mr} Competitors={has_comp} Website={has_web} MarketingKit={has_mk} Funding={has_fund}')

asyncio.run(full_test())
