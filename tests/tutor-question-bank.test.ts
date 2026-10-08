import test from "node:test";
import assert from "node:assert/strict";
import data from "../src/data/draft/math9-question-bank.json";

test("Math 9 draft bank has 100 distinct questions with reviewed metadata not falsely published",()=>{
  assert.equal(data.length,100);
  assert.equal(new Set(data.map(q=>q.id)).size,100);
  const bySkill=new Map<string,number>();
  for(const question of data){
    assert.equal(question.gradeId,"9");
    assert.equal(question.subjectId,"toan");
    assert.equal(question.status,"draft");
    assert.equal(question.source,"generated-requires-academic-review");
    assert.equal(question.options.length,4);
    assert.equal(new Set(question.options).size,4);
    assert.ok(question.correctIndex>=0&&question.correctIndex<4);
    assert.ok(question.options[question.correctIndex]);
    assert.ok(question.explanation.length>30);
    assert.ok(question.errorCodes.length>0);
    bySkill.set(question.skillId,(bySkill.get(question.skillId)??0)+1);
    // JSON imports widen discriminants. Narrow the validated check payload
    // by its documented kind before performing the arithmetic invariants.
    const v=question.check as
      | {kind:"radical-domain";a:number}
      | {kind:"radical-simplify";n:number;k:number;m:number}
      | {kind:"parabola";a:number;x:number;y:number}
      | {kind:"system";x:number;y:number;sum:number;difference:number}
      | {kind:"inscribed-angle";central:number;angle:number};
    if(v.kind==="radical-domain"){
      assert.equal(question.options[question.correctIndex],`$x\\ge ${v.a}$`);
    }else if(v.kind==="radical-simplify"){
      assert.equal(v.n,v.k*v.k*v.m);
      assert.equal(question.options[question.correctIndex],`$${v.k}\\sqrt{${v.m}}$`);
    }else if(v.kind==="parabola"){
      assert.equal(v.y,v.a*v.x*v.x);
      assert.equal(question.options[question.correctIndex],`$a=${v.a}$`);
    }else if(v.kind==="system"){
      assert.equal(v.x+v.y,v.sum);
      assert.equal(v.x-v.y,v.difference);
      assert.equal(question.options[question.correctIndex],`$(${v.x};${v.y})$`);
    }else if(v.kind==="inscribed-angle"){
      assert.equal(v.central,2*v.angle);
      assert.equal(question.options[question.correctIndex],`$${v.angle}^\\circ$`);
    }else {
      assert.fail("unsupported check kind "+(v as {kind:string}).kind);
    }
  }
  assert.deepEqual([...bySkill.values()].sort((a,b)=>a-b),[20,20,20,20,20]);
});
