// A forward-only lexical screen keeps direct DOM helpers bounded even for
// malformed inputs. It does not parse XML or remove text from the document.
export function assertSafeGpxMarkup(text){
  for(let offset=0;(offset=text.indexOf('<',offset))!==-1;offset++){
    if(text.startsWith('<!--',offset)||text.startsWith('<![CDATA[',offset)){
      const comment=text.startsWith('<!--',offset),end=text.indexOf(comment?'-->':']]>',offset+(comment?4:9));
      if(end<0)throw new Error('GPX XML 註解或 CDATA 未完整結束。');
      offset=end+2;continue;
    }
    if(text.startsWith('<!',offset)){
      let token=offset+2;while(token<text.length&&/\s/u.test(text[token]))token++;
      if(/^(?:DOCTYPE|ENTITY)/i.test(text.slice(token,token+7)))throw new Error('GPX 不接受 DTD 或 XML 實體。');
    }
    if(text.startsWith('<?',offset)&&!/^<\?xml(?:\s|\?)/.test(text.slice(offset,offset+6)))throw new Error('GPX 不接受 XML 處理指令。');
  }
}
