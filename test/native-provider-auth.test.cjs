'use strict';
const test=require('node:test');const assert=require('node:assert/strict');
const { nativeProviderAuthEnv }=require('./load-ts.cjs')('src/main/nativeProviderAuth.ts');
test('native cloud CLIs receive only their own stored API key',()=>{
 const requested=[];const getSecret=ref=>{requested.push(ref);return {'apikey:anthropic':'anthropic-test','apikey:google':'google-test','apikey:openai':'openai-test'}[ref];};
 assert.deepEqual(nativeProviderAuthEnv('claude',getSecret),{ANTHROPIC_API_KEY:'anthropic-test'});
 assert.deepEqual(nativeProviderAuthEnv('gemini',getSecret),{GEMINI_API_KEY:'google-test'});
 assert.deepEqual(requested,['apikey:anthropic','apikey:google']);
});
test('missing key leaves existing CLI login available',()=>{
 assert.deepEqual(nativeProviderAuthEnv('claude',()=>undefined),{});
 assert.deepEqual(nativeProviderAuthEnv('gemini',()=>undefined),{});
});
test('other engines keep their own authentication path',()=>{
 for(const provider of ['codex','sekhon-local','opencode','crush','pi','qwen','custom']) assert.deepEqual(nativeProviderAuthEnv(provider,()=>{throw Error('must not fetch unrelated keys')}),{});
});

test('Gemini API sessions use their private user profile instead of rejected system settings',()=>{
 const path=require('node:path');const settings=path.join('private-agent','.gemini-hive','system-settings.json');
 const env=nativeProviderAuthEnv('gemini',()=> 'google-test',settings);
 assert.equal(env.GEMINI_CLI_HOME,path.dirname(settings));assert.equal(env.GEMINI_CLI_SYSTEM_SETTINGS_PATH,'');assert.equal(env.GEMINI_API_KEY,'google-test');
 assert.deepEqual(nativeProviderAuthEnv('gemini',()=>undefined,settings),{});
});
test('Gemini profile contains lifecycle hooks and API auth but no credentials',async t=>{
 const fs=require('node:fs'),os=require('node:os'),path=require('node:path');const {HiveManager}=require('./load-ts.cjs')('src/main/hive.ts');
 const home=fs.mkdtempSync(path.join(os.tmpdir(),'sekhon-gemini-profile-'));t.after(()=>fs.rmSync(home,{recursive:true,force:true}));
 const hive=new HiveManager(()=>home);const injection=await hive.ensureAgent({id:'gemini-test',name:'Gemini Test',provider:'gemini',cwd:home},{semanticMemory:false});
 const profile=path.dirname(injection.env.GEMINI_CLI_SYSTEM_SETTINGS_PATH);const settings=JSON.parse(fs.readFileSync(path.join(profile,'.gemini','settings.json')));
 assert.equal(settings.security.auth.selectedType,'gemini-api-key');assert.equal(settings.hooksConfig.enabled,true);
 assert.deepEqual(Object.keys(settings.hooks),['SessionStart','BeforeAgent','BeforeTool','AfterTool','AfterAgent']);assert.equal(settings.env,undefined);assert.equal(settings.apiKey,undefined);
});
