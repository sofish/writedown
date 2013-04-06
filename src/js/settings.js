/**
 * @author: Sofish Lin
 * @site: http://sofish.de
 * @license: MIT
 */

$(function(){

  var $settings = $('input');

  // set default value
  $preview.on('change', 'input', function() {
    var val, that;

    that = $(this);
    val = that.val();

    if(that.attr('type') === 'range') that.parent().find('span').html(val);
    localStorage.setItem('wd' + that.attr('id'), val);
  });

  // default value
  ~function() {

    $settings.each(function() {
      var item = $(this)
        , history = localStorage.getItem('wd' + item.attr('id'));

      if(history) item.val(history);
      if(item.attr('type') === 'range') item.parent().find('span').html(item.val());
    })

  }();


  // reset to default
  $('#reset').on('click', function() {
    $settings.each(function() {
      var item = $(this);
      localStorage.removeItem('wd' + item.attr('id'));
      item.val(item.data('default'));
      item.trigger('change');
    })
  })

})