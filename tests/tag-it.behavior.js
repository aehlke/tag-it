/* Load jQuery, jQuery UI, tag-it, then this file in a real browser. */
window.runTagItRegressions = async function() {
    var passed = [], fixture;
    function equal(actual, expected, name) {
        if (JSON.stringify(actual) !== JSON.stringify(expected)) {
            throw new Error(name + ': ' + JSON.stringify(actual) + ' != ' + JSON.stringify(expected));
        }
    }
    function keyEvent(type, properties) {
        return jQuery.extend(jQuery.Event(type), properties);
    }
    function widget(node) { return node.data('ui-tagit') || node.data('tagit'); }
    async function test(name, body) {
        fixture = jQuery('<form></form>').appendTo('body');
        try { await body(); passed.push(name); }
        finally {
            fixture.find('.tagit').each(function() {
                var node = jQuery(this);
                if (widget(node)) node.tagit('destroy');
            });
            fixture.find('input, textarea').each(function() {
                var node = jQuery(this);
                if (widget(node)) node.tagit('destroy');
            });
            fixture.remove();
        }
    }
    await test('strings, list initialization and createTag bridge compatibility', function() {
        var list = jQuery('<ul><li>one</li></ul>').appendTo(fixture).tagit({animate:false});
        equal(list.tagit('assignedTags'), ['one'], 'initial strings');
        equal(list.tagit('createTag', 'two')[0] === list[0], true, 'success preserves widget chaining');
        equal(list.tagit('assignedTags'), ['one','two'], 'create string');
    });
    await test('safe object labels, numeric zero and hidden-field values', function() {
        var list = jQuery('<ul></ul>').appendTo(fixture).tagit({fieldName:'tags\" onfocus=\"bad', animate:false});
        var value = '0\"/><img src=x onerror=alert(1)>';
        list.tagit('createTag', {label:'<b>Label & "quote"</b>', value:value}, 'extra');
        list.tagit('createTag', {label:'Zero', value:0});
        equal(list.find('img,b').length, 0, 'no injected elements');
        equal(list.find('input[type=hidden]').first().val(), value, 'lossless hidden value');
        equal(list.find('input[type=hidden]').first().attr('name'), 'tags\" onfocus=\"bad', 'name is data');
        equal(list.tagit('assignedTags'), [value,'0'], 'submitted IDs');
        equal(list.tagit('tagLabel',list.find('.tagit-choice').first()), '<b>Label & "quote"</b>', 'display label');
    });
    await test('li label/value preloading and legacy third argument', function() {
        var seen=[];
        var list=jQuery('<ul><li data-value="0">Zero</li><li>plain</li></ul>').appendTo(fixture).tagit({
            animate:false, afterTagAdded:function(event,ui){seen.push(ui.duringInitialization);}
        });
        equal(list.tagit('assignedTags'), ['0','plain'], 'li values');
        equal(seen, [true,true], 'duringInitialization retained');
    });
    await test('single-field quoting and destroy/reinitialize round trip', function() {
        var input=jQuery('<input name="tags"/>').val('apple,"New York, NY","say ""yes"""').appendTo(fixture).tagit({animate:false,singleFieldQuoted:true});
        equal(input.tagit('assignedTags'), ['apple','New York, NY','say "yes"'], 'decoded fields');
        var serialized=input.val();
        input.tagit('destroy').tagit({animate:false,singleFieldQuoted:true});
        equal(input.tagit('assignedTags'), ['apple','New York, NY','say "yes"'], 'roundtrip');
        equal(input.val(), serialized, 'stable serialization');
    });
    await test('single-field object identity and one duplicate removal', function() {
        var removed;
        var input=jQuery('<input/>').appendTo(fixture).tagit({allowDuplicates:true,animate:false,singleFieldQuoted:true,
            afterTagRemoved:function(event,ui){removed=widget(input).tagValue(ui.tag);}});
        input.tagit('createTag',{label:'same',value:'a,b'});
        input.tagit('createTag',{label:'same',value:'a,b'});
        input.tagit('removeTag',widget(input)._tags().first(),false);
        equal(input.tagit('assignedTags'), ['a,b'], 'one selected duplicate removed');
        equal(removed,'a,b','value survives removal');
    });
    await test('multi-character delimiter and rejected pasted suffix retention', function() {
        var input=jQuery('<input/>').appendTo(fixture).tagit({singleFieldDelimiter:'||',allowSpaces:true,tagLimit:2,animate:false});
        var instance=widget(input);
        instance.tagInput.val('one||two||three').trigger('paste');
        return new Promise(function(resolve,reject){setTimeout(function(){try{
            equal(input.tagit('assignedTags'),['one','two'],'accepted paste');
            equal(instance.tagInput.val(),'three','rejected suffix retained');resolve();
        }catch(error){reject(error);}},10);});
    });
    await test('veto retains input and callbacks observe the serialized addition', function() {
        var observed=[];
        var input=jQuery('<input/>').appendTo(fixture).tagit({animate:false,
            beforeTagAdded:function(event,ui){return ui.tagLabel !== 'reject';},
            onTagAdded:function(){observed.push(input.tagit('assignedTags'));}});
        var instance=widget(input);
        instance.tagInput.val('accept,reject,last').trigger('blur');
        equal(input.tagit('assignedTags'),['accept','last'],'vetoed field absent');
        equal(instance.tagInput.val(),'reject','vetoed field retained');
        equal(observed,[['accept'],['accept','last']],'deprecated callback serialization');
    });
    await test('readOnly toggles without lifecycle events or tag replacement', function() {
        var count=0;
        var list=jQuery('<ul><li>one</li></ul>').appendTo(fixture).tagit({tabIndex:0,animate:false,
            afterTagAdded:function(){count++;},afterTagRemoved:function(){count++;}});
        var instance=widget(list), first=instance._tags()[0];
        list.tagit('option','readOnly',true);
        equal(instance.tagInput[0].disabled,true,'disabled');
        list.tagit('option','readOnly',false);
        equal(instance.tagInput[0].disabled,false,'enabled');
        equal(instance._tags()[0]===first,true,'same tag');
        equal(count,1,'no artificial events');
        equal(instance._tags().find('.tagit-close').attr('tabindex'),'0','zero tabindex');
    });
    await test('default source handles objects, live availableTags and substring option', function() {
        var list=jQuery('<ul/>').appendTo(fixture).tagit({availableTags:[{label:'Japan',value:'JP'},'Java'],animate:false});
        var instance=widget(list), result;
        instance.options.autocomplete.source({term:'ja'},function(items){result=items;});
        equal(result.length,2,'mixed source');
        list.tagit('createTag',{label:'Japan',value:'JP'});
        instance.options.autocomplete.source({term:'ja'},function(items){result=items;});
        equal(result,['Java'],'value-based subtraction');
        list.tagit('option','availableTags',['replacement']);
        list.tagit('option','matchFromStart',false);
        instance.options.autocomplete.source({term:'place'},function(items){result=items;});
        equal(result,['replacement'],'updated source and matching');
    });
    await test('length and local-catalog restrictions apply to programmatic values', function() {
        var list=jQuery('<ul/>').appendTo(fixture).tagit({maxTagLength:3,allowOnlyAutocompleteTags:true,
            availableTags:['one','three'],preprocessTag:function(v){return v.toLowerCase();},animate:false});
        list.tagit('createTag','ONE'); list.tagit('createTag','three'); list.tagit('createTag','two');
        equal(list.tagit('assignedTags'),['one'],'final transformed values checked');
    });
    await test('composition and non-US physical comma key are preserved', function() {
        var list=jQuery('<ul/>').appendTo(fixture).tagit({animate:false});
        var instance=widget(list);
        instance.tagInput.val('日本').trigger('compositionstart').trigger(keyEvent('keydown',{which:13}));
        equal(list.tagit('assignedTags'),[],'composition not committed');
        instance.tagInput.trigger('compositionend');
        instance.tagInput.val('б').trigger(keyEvent('keydown',{which:188,key:'б',shiftKey:false}));
        equal(list.tagit('assignedTags'),[],'physical comma is not punctuation');
        instance.tagInput.trigger(keyEvent('keydown',{which:188,key:',',shiftKey:false}));
        equal(list.tagit('assignedTags'),['б'],'actual comma commits');
    });
    await test('quoted comma, allowCommas, and unfinished quote', function() {
        var list=jQuery('<ul/>').appendTo(fixture).tagit({animate:false,allowSpaces:true});
        var instance=widget(list);
        instance.tagInput.val('"a,b"').trigger('blur');
        equal(list.tagit('assignedTags'),['a,b'],'quoted punctuation');
        list.tagit('option','allowCommas',true);
        instance.tagInput.val('c,d').trigger('input').trigger('blur');
        equal(list.tagit('assignedTags'),['a,b','c,d'],'literal comma option');
        instance.tagInput.val('"unfinished').trigger('blur');
        equal(instance.tagInput.val(),'"unfinished','unfinished retained');
    });
    await test('textarea destroy preserves its form value', function() {
        var input=jQuery('<textarea name="tags"/>').val('one,two').appendTo(fixture).tagit({animate:false});
        equal(input.tagit('assignedTags'),['one','two'],'textarea initialized');
        input.tagit('destroy'); equal(input.val(),'one,two','value retained');
        equal(input.hasClass('tagit-hidden-field'),false,'textarea revealed');
    });
    await test('manual object highlight uses normal custom select for Enter and Tab', function() {
        jQuery.each([{code:13,key:'Enter',only:false},{code:9,key:'Tab',only:true}], function(index, item) {
            var selected=[];
            var list=jQuery('<ul/>').appendTo(fixture).tagit({animate:false,autocompleteOnly:item.only,
                availableTags:[{label:'Japan',value:'JP'}],autocomplete:{autoFocus:false,delay:0,
                    select:function(event,ui){
                        selected.push(ui.item.value);
                        list.tagit('createTag',ui.item);
                        return false;
                    }}});
            var instance=widget(list);
            instance.tagInput.val('Ja').autocomplete('search','Ja');
            instance.tagInput.trigger(keyEvent('keydown',{which:40,keyCode:40,key:'ArrowDown'}));
            instance.tagInput.trigger(keyEvent('keydown',{which:item.code,keyCode:item.code,key:item.key}));
            equal(selected,['JP'],item.key+' invokes the supplied select once');
            equal(list.tagit('assignedTags'),['JP'],item.key+' preserves the object ID');
            equal(instance._tags().length,1,item.key+' has no typed-label duplicate');
            instance.tagInput.autocomplete('close').val('manual');
            instance.tagInput.trigger(keyEvent('keydown',{which:13,keyCode:13,key:'Enter'}));
            equal(list.tagit('assignedTags'),item.only?['JP']:['JP','manual'],'no-active manual input obeys mode');
            if (item.only) equal(instance.tagInput.val(),'manual','selection-only manual text remains');
        });
    });
    await test('rejected paste preserves authored boundaries with literal commas enabled', function() {
        var list=jQuery('<ul/>').appendTo(fixture).tagit({animate:false,maxTagLength:3,
            allowCommas:true,allowSpaces:false});
        var instance=widget(list);
        instance.tagInput.val('long  longer ok toolong').trigger('paste');
        return new Promise(function(resolve,reject){setTimeout(function(){try{
            equal(list.tagit('assignedTags'),['ok'],'valid middle field accepted');
            equal(instance.tagInput.val(),'long  longer toolong','actual space boundaries retained');
            instance.tagInput.trigger('blur');
            equal(instance.tagInput.val(),'long  longer toolong','retry does not invent commas');
            resolve();
        }catch(error){reject(error);}},10);});
    });
    return {passed:passed.length, cases:passed};
};
