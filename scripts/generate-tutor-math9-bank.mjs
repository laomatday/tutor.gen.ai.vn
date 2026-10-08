// Deterministic draft bank generator; subject matter expert approval required.
// Run: node scripts/generate-tutor-math9-bank.mjs
import {writeFileSync, mkdirSync} from "node:fs";
import {dirname} from "node:path";
import {fileURLToPath} from "node:url";

const m=[2,3,5,6,7,10,11,13,14,15];
const coeff=[-4,-3,-2,2,3,4],xs=[-3,-2,-1,1,2,3];
function make(id,skillId,prompt,correct,other,explanation,check,errorCodes,index){
 const options=other.slice();options.splice(index%4,0,correct);
 if(new Set(options).size!==4)throw Error("duplicate options "+id);
 return {id,gradeId:"9",subjectId:"toan",skillId,status:"draft",source:"generated-requires-academic-review",prompt,options,correctIndex:index%4,explanation,check,errorCodes};
}
export function buildBank(){
 const bank=[];
 for(let i=0;i<20;i++){
  const a=i-10,expr=a<0?`x+${-a}`:a===0?"x":`x-${a}`;
  bank.push(make(`m9-radical-domain-${String(i+1).padStart(2,"0")}`,"math9-radical-domain",
    `Biểu thức $\sqrt{${expr}}$ xác định khi nào?`,`$x\ge ${a}$`,
    [`$x>${a}$`,`$x\le ${a}$`,`$x\ge ${a+1}$`],
    `Biểu thức dưới căn phải không âm: ${expr} ≥ 0, nên x ≥ ${a}.`,
    {kind:"radical-domain",a,expr},["RAD_DOMAIN_NONNEGATIVE","RAD_INEQUALITY_BOUNDARY"],i));
 }
 for(let i=0;i<20;i++){
  const k=2+(i%4),a=m[Math.floor(i/2)%m.length],n=k*k*a;
  bank.push(make(`m9-radical-simplify-${String(i+1).padStart(2,"0")}`,"math9-radical-simplification",
   `Rút gọn biểu thức $\sqrt{${n}}$ (kết quả ở dạng căn tối giản).`,`$${k}\sqrt{${a}}$`,
   [`$${k+1}\sqrt{${a}}$`,`$\sqrt{${k*a}}$`,`$${k-1}\sqrt{${a}}$`],
   `Vì ${n} = ${k}² × ${a}, ta có √${n} = ${k}√${a}.`,
   {kind:"radical-simplify",k,m:a,n},["RAD_SQUARE_FACTOR","RAD_MULTIPLIER"],i));
 }
 for(let i=0;i<20;i++){
  const a=coeff[i%coeff.length],x=xs[Math.floor(i/coeff.length)%xs.length],y=a*x*x;
  bank.push(make(`m9-parabola-coeff-${String(i+1).padStart(2,"0")}`,"math9-parabola",
   `Hàm số $y=ax^2$ đi qua $M(${x};${y})$. Hệ số $a$ bằng bao nhiêu?`,`$a=${a}$`,
   [`$a=${a+1}$`,`$a=${a-1}$`,`$a=${-a}$`],
   `Thay tọa độ vào y = ax²: ${y} = a × (${x})². Suy ra a = ${a}.`,
   {kind:"parabola",a,x,y},["PARABOLA_SQUARE_NEGATIVE","PARABOLA_SUBSTITUTION"],i));
 }
 for(let i=0;i<20;i++){
  const x=1+i%5,y=-(1+Math.floor(i/5)),sum=x+y,difference=x-y;
  bank.push(make(`m9-equation-system-${String(i+1).padStart(2,"0")}`,"math9-equation-systems",
   `Nghiệm của hệ $\begin{cases}x+y=${sum}\\x-y=${difference}\end{cases}$ là cặp nào?`,
   `$(${x};${y})$`,
   [`$(${y};${x})$`,`$(${-x};${y})$`,`$(${x};${-y})$`],
   `Cộng hai phương trình được 2x = ${sum+difference}, suy ra x = ${x}; rồi y = ${y}.`,
   {kind:"system",x,y,sum,difference},["SYSTEM_ELIMINATION","SYSTEM_SIGN"],i));
 }
 for(let i=0;i<20;i++){
  const angle=15+i*3,central=angle*2;
  bank.push(make(`m9-circle-angle-${String(i+1).padStart(2,"0")}`,"math9-circle-angles",
   `Góc ở tâm chắn cung nhỏ AB có số đo ${central}°. Góc nội tiếp chắn cùng cung nhỏ AB bằng bao nhiêu?`,
   `$${angle}^\circ$`,
   [`$${central}^\circ$`,`$${angle+5}^\circ$`,`$${angle-5}^\circ$`],
   `Góc nội tiếp chắn cùng cung bằng nửa góc ở tâm: ${central}° ÷ 2 = ${angle}°.`,
   {kind:"inscribed-angle",central,angle},["CIRCLE_HALF_CENTRAL_ANGLE"],i));
 }
 return bank;
}
if(process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]){
 const destination="src/data/draft/math9-question-bank.json";
 mkdirSync(dirname(destination),{recursive:true});
 writeFileSync(destination,JSON.stringify(buildBank(),null,2)+"
");
 console.log("Generated 100 draft math9 items (academic approval required): "+destination);
}
